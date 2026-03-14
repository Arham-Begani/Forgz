import subprocess
import os

def run(cmd):
    return subprocess.run(cmd, shell=True, capture_output=True, text=True).stdout.strip()

status = run("git status --porcelain")
lines = status.splitlines()

# Clean up junk files from previous activity
junk = [
    "authors.txt", "authors_after.txt", "check_B.py", "check_final.txt", 
    "check_main_log.txt", "check_msg.txt", "clean_msg.py", "commit_B.txt",
    "commit_info.txt", "commit_raw.txt", "committer_hashes.txt",
    "committers.txt", "debug_commit.py", "log.txt", "rewrite_history.sh",
    "rewrite_history2.sh", "status.txt", "test_commit_msg.txt"
]

for f in junk:
    if os.path.exists(f):
        os.remove(f)

# Re-run status
status = run("git status --porcelain")
lines = status.splitlines()

for line in lines:
    if not line: continue
    mode = line[:2]
    path = line[3:].strip('"')
    
    # Skip directories that are untracked (we usually want individual files)
    if os.path.isdir(path) and mode == "??":
        # Add all files in untracked dir
        for root, dirs, files in os.walk(path):
            for file in files:
                fpath = os.path.join(root, file)
                print(f"Committing {fpath}")
                subprocess.run(f'git add "{fpath}"', shell=True)
                msg = f"feat: add {fpath}"
                subprocess.run(f'git commit -m "{msg}" --author="Arham-Begani <arhambegani2@gmail.com>"', shell=True)
        continue

    print(f"Committing {path} with mode {mode}")
    subprocess.run(f'git add "{path}"', shell=True)
    msg = f"chore: update {path}" if mode.strip() == "M" else f"feat: add {path}"
    subprocess.run(f'git commit -m "{msg}" --author="Arham-Begani <arhambegani2@gmail.com>"', shell=True)
