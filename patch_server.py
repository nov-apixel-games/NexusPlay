import re

with open('server.ts', 'r') as f:
    content = f.read()

# Match the setInterval block for image cleanup
match = re.search(r"// Background Task: Image Cleanup \(Every 12 hours\)\nsetInterval\(async \(\) => \{.*?\}\);\n", content, re.DOTALL)
if match:
    content = content[:match.start()] + content[match.end():]
    with open('server.ts', 'w') as f:
        f.write(content)
    print("Removed setInterval")
else:
    # Try just setInterval
    match = re.search(r"setInterval\(async \(\) => \{.*?\n\}\);\n", content, re.DOTALL)
    if match:
        content = content[:match.start()] + content[match.end():]
        with open('server.ts', 'w') as f:
            f.write(content)
        print("Removed setInterval alternative")
    else:
        print("setInterval not found")

