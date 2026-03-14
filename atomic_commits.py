import subprocess
import os

def run(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout.strip()

# Cleanup debug files first
junk = ["history_check.txt", "history_debug.txt", "reflog_full.txt", "current_status.txt", "status.txt"]
for f in junk:
    if os.path.exists(f):
        os.remove(f)

# Unstage everything and then add one by one to ensure we have "all current changes"
subprocess.run("git reset", shell=True)

status = run("git status --porcelain")
lines = status.splitlines()

for line in lines:
    if not line: continue
    mode = line[:2]
    path = line[3:].strip('"')
    
    if path in [".claude/settings.local.json", "package-lock.json"]:
        # Skip sensitive or derived files unless they are logically part of the change
        # User said "commit everything", so I will include them but maybe they deserve a chore message.
        pass

    print(f"Committing {path}")
    subprocess.run(f'git add "{path}"', shell=True)
    
    # Generate message based on directory/file
    if "agents" in path:
        msg = f"feat: enhance {os.path.basename(path)} logic"
    elif "app/api" in path:
        msg = f"feat: update {path} endpoint"
    elif "claude" in path:
        msg = f"chore: update {os.path.basename(path)}"
    else:
        msg = f"chore: update {path}"

    subprocess.run(f'git commit -m "{msg}" --author="Arham-Begani <arhambegani2@gmail.com>"', shell=True)

print("Done committing all changes one by one.")
