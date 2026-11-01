Sandbox and token: two kinds of isolation

"Isolating the agent" hides two questions that do not replace each other. Separate them and the configuration becomes legible, and a failure tells you which layer to look at.

- **Which directories on this machine may be written?** That is the local sandbox.
- **Which repository on GitHub may be changed?** That is the credential.

Neither a prompt nor a project rule file answers either one. The first is an instruction, the second is a written agreement; both can be obeyed and both can be ignored. Permissions are what hold.

## 1. What the local sandbox does technically

Codex uses Seatbelt on macOS, bubblewrap plus seccomp on Linux, and a native implementation on Windows. The idea is the same everywhere: give the agent a bounded place to run, so that commands inherit the boundary instead of relying on a prompt to keep them honest.

There are three sandbox modes:

- read-only: read, no write.
- workspace-write: writable inside the working directory, read-only outside it. The daily working mode.
- danger-full-access: no boundary.

The writable set is three things: the current working directory, the system temporary directory, and the temporary directory named by the environment. Everything else on the machine can be read, just not written.

A few paths stay read-only even inside the writable set, and the protection is recursive: .git, .agents, .codex and .aws. The reason is practical: they hold version history, the agent's own state and cloud credentials, and letting the agent rewrite them would make the sandbox decorative. It also has a direct consequence, which the next section shows.

The approval policy is a separate thing. It does not move the boundary, it decides what happens at the edge:

- on-request: crossing the boundary raises a question.
- never: crossing it fails the command, and the error goes back to the model.

## 2. Measurements: the same action, three outcomes

I ran each of these inside the sandbox. Every line below is an actual result, not a line from a design document:

| Action | Result |
| --- | --- |
| create a file inside the working directory | succeeded |
| read a file outside the working directory | succeeded, reads are allowed |
| create a file outside the working directory | Operation not permitted |
| create a file in another project directory | Operation not permitted |
| write into the system temporary directory | succeeded |
| git add inside the sandbox | failed: cannot create .git/index.lock |
| git add and git commit outside the sandbox | succeeded |

The third and fourth rows together are the full meaning of "writable inside the directory, read-only outside it", including the part where outside files remain readable.

The last two rows are the real trap in this layer: the sandbox keeps .git read-only, so an ordinary commit cannot run inside the boundary. The way to keep the sandbox and still commit is a rule file: one allow rule for the write-shaped git subcommands, so they run outside the sandbox without a prompt.

## 3. The repository credential

The first layer does not reach the far side. A session can read any local file and can send network requests, so the local boundary does not by itself limit which repository it can change. That is the credential's job.

The answer is one fine-grained personal access token per repository, with repository access naming that single repository and the smallest permission set the work actually needs. Tokens live in a credential directory outside any repository, with 700 on the directory and 600 on each file.

When a session starts, the launcher injects that one token into the environment, and both the command line tools and git use it: git's credential helper prefers the token in the environment over the machine-wide login in the keychain. That is the hinge of the whole design, because a machine-wide login usually reaches every repository the account can see, and that over-broad reach is exactly the thing being removed.

A session without a matching token does not fall back to the machine-wide login. It receives a placeholder value instead, so GitHub calls fail outright rather than quietly using a token with too much scope. Failing is easier to diagnose than succeeding with the wrong scope.

What the second layer really buys is this: even if the sandbox is bypassed and even if the model is manipulated, the token in that session can only change one repository, and that repository is the one it was granted.

## 4. Why the two layers do not replace each other

| What you want | Which layer can do it |
| --- | --- |
| no writes outside the directory | sandbox |
| no reads outside the directory | not possible; the sandbox allows reads by design |
| no changes to another repository | token scope |
| no sending local content outward | the sandbox cannot stop it; it takes network policy and credentials that never appear in output |
| obeying project conventions | prompts and project files, on trust alone |

The last row is the one to keep in mind: "do not access unrelated repositories" written into a project file is a request, not a lock. The token is the lock.

## 5. The openings that remain

This setup has clear limits, and stating them is better than pretending otherwise.

**Reads are total.** The sandbox allows reading any file on the machine. Files outside the directory cannot be changed, but they cannot be excluded from being read either. Genuinely sensitive material needs isolation at the operating system level, or it needs not to be there under that identity at all.

**The token sits in an environment variable.** Environment variables are inherited by child processes and can be printed. I forbid the commands that print credentials one by one: printing the environment, printing a single environment variable, printing the GitHub token, and printing git credentials. That lowers the probability rather than removing the risk; the real backstop is a token with a small scope and a short life.

**The network is open.** Daily work pushes commits and calls APIs, so outbound traffic is enabled inside the sandbox. That means anything the session can read could also be sent out. The writable set limits what it can change; it does not limit what it can transmit. Tightening that means turning network access off and allow-listing only the hosts the work needs.

**Same machine, same identity.** The sandbox and the tokens are boundaries inside one system user. They are good at stopping mistakes and at keeping scope from spreading, and they are not isolation. For "genuinely out of reach", the answer is a different system user, a container, or a virtual machine.

## 6. A checklist worth running

After configuring any of this, it is worth checking it yourself:

1. Write a file inside the working directory. It should succeed.
2. Write a file outside the working directory. It should fail, and the failure should contain no approval question.
3. Read a file outside the working directory. It should succeed.
4. Write a file in another project directory. It should fail.
5. Make a commit. It should succeed; if it does not, the command rules are not in effect.
6. Print the environment. It should be refused.
7. From that session, reach a repository it is not allowed to touch. It should fail.

The first six take a few minutes. The last one is the reason the whole arrangement exists, and it is worth confirming on its own.
