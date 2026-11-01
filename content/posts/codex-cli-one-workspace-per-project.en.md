One workspace per project

I settled on one rule for how I drive Codex CLI: one folder per project, one session per folder. A session may write inside its own directory and read anywhere on the machine, but it cannot write outside that directory, and it never stops to ask me for permission.

That rule is not a taste. Three concrete problems forced it.

**Context leaks across projects.** Whatever a session has already absorbed stays with it, so the next project starts with the previous project's assumptions, and those assumptions quietly explain the new code.

**Directories leak.** The working directory is the current folder, but the session can read files elsewhere, so conclusions from another project get treated as facts about this one.

**Credentials leak too.** A single machine-wide GitHub login usually reaches every repository the account can see, so a repository that a project is not supposed to touch is in fact always in reach.

All three share one property: a prompt cannot fix them. A prompt is an instruction, a directory and a credential are permissions. To make the boundary real, it has to start at the file system.

## 1. Three layers

I ended up with three layers, each owning one question:

| Layer | Where it lives | What it decides |
| --- | --- | --- |
| Workspace boundary | user config plus one profile per project | which directories can be written |
| Command rules | a rules file next to the config | which commands may leave the sandbox, and which credential-printing commands are refused |
| Repository identity | a project list plus a directory that only holds tokens | which GitHub repository the session can reach |

The first layer is Codex's own sandbox. The second is the exceptions and the prohibitions of that same sandbox. The third lives entirely outside Codex, and rests on one separate credential per repository.

## 2. What the configuration looks like

The user config carries the defaults:

```toml
approval_policy = "never"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = true
writable_roots = []
```

`approval_policy = "never"` is the part that matters. My approval habit is "anything outside the boundary gets declined", so a prompt carries no information at all: it only turns a failure into a wait. With never, an out-of-boundary write is not a question, it is an error. The error goes back to the model, the model sees the failure, and it changes course on its own.

Each project gets a profile file that only states what differs from the default, plus the trust state of that directory:

```toml
model = "gpt-6-luna"
approval_policy = "never"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = true
writable_roots = []

[projects."~/code/agent-eval"]
trust_level = "trusted"
```

A profile is a layer on top of the user config, and the profile wins on conflicting keys. So "one permission preset per project" needs no mechanism of my own; Codex already has one.

Command rules live in a rules directory, in a syntax that reads like Python:

```python
prefix_rule(pattern=["git", "commit"], decision="allow",
            justification="Local commit is covered by the standing authorisation.")
prefix_rule(pattern=["printenv"], decision="forbidden",
            justification="Printing the environment would expose the scoped token.")
```

allow means "this command may run outside the sandbox, without a prompt". forbidden means "this command is refused outright". When several rules match, the strictest decision wins.

The project list ties a directory, a profile and a repository together:

```toml
[projects.agent-eval]
path = "~/code/agent-eval"
profile = "agent-eval"
repo = "example/agent-eval"
```

I also wrote a small launcher that does all three things at once: pick the profile, point the working directory at the project, and inject the single repository-scoped token into the environment. One name in the terminal starts the work.

## 3. What I measured

I ran the boundary against a throwaway repository. Three commands, three outcomes:

| Command | Result |
| --- | --- |
| write a file inside the working directory | succeeded |
| write a file outside the working directory | failed with Operation not permitted; the error went back to the model, no prompt |
| git add and git commit | succeeded |

The second row is the one that matters: the failure was immediate, not "ask first, then fail".

## 4. Five things that bit back

**One: .git is read-only in workspace-write.** I found this by running the command inside the sandbox: git add reported `Unable to create '.git/index.lock': Operation not permitted`. In other words, an ordinary commit does not run inside the boundary. The fix is to give the write-shaped git subcommands an allow rule so they run outside the sandbox without a prompt. Commits work, and the session never has to leave the sandboxed state.

**Two: never does not mean "fewer prompts", it means "out of bounds is an error".** This deserves its own line, because it decides what a failure looks like. Under on-request, going out of bounds becomes a wait. Under never, it becomes a failed command. Both stop the write, but only the second one does not spend attention, and only the second one does not suggest that clicking yes would have worked.

**Three: the temporary directory is writable.** The session state spells it out: the writable set is the working directory, the temporary directory and the system temporary directory. So "read-only outside the directory" has an exception there. A file written to a temporary directory is not a change to any project, but it is not read-only either.

**Four: a rule prefix matches argument by argument, exactly.** My first attempt at guarding the whole credential directory did nothing. The reason is that every element of a pattern has to equal one argument of the command; a directory prefix does not behave like a wildcard. What I ended up with was the four commands that actually print credentials, each forbidden by name: printing the environment, printing one environment variable, printing the GitHub token, and printing git credentials.

**Five: the command line and the desktop app do not share a model catalogue.** The model the desktop app defaults to is refused by the backend when the command line asks for it with the same account, and every request fails with "model not found". Pinning a model that answers, inside the profile, fixes it. This has nothing to do with isolation, but it makes the whole setup look broken if you do not know it.

## 5. Adding a project

Three steps:

1. Add a line to the project list: directory, profile, repository.
2. Mint a fine-grained token for that one repository with the smallest permission set that works, and store it in a credential directory outside any repository, readable only by the current user.
3. Start the session by name.

Tokens never enter a repository, a prompt file, a commit message or a log.

## 6. What this still does not do

What the setup delivers is this: a session cannot write into another directory, and cannot obtain a token for another repository.

What it does not deliver is "technically out of reach". If a repository genuinely must not be touchable from this project, the operating system has to provide that guarantee: a separate system user, a container or a virtual machine that puts that directory outside this identity entirely. The sandbox and the tokens are boundaries inside one machine and one user identity. They are good at stopping mistakes and at keeping scope from spreading, and they are not a substitute for isolation.

My trade: daily work runs on directory plus sandbox plus repository-scoped tokens. Anything that must not be reachable moves to another system user or another machine.
