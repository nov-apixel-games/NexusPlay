with open('src/components/admin/AdminViews2.tsx', 'r') as f:
    content = f.read()

import re
# find lucide-react import and add Trash, Clock
match = re.search(r'import\s+\{(.*?)\}\s+from\s+[\'"]lucide-react[\'"]', content)
if match:
    imports = match.group(1)
    if 'Trash' not in imports:
        imports += ', Trash'
    if 'Clock' not in imports:
        imports += ', Clock'
    
    new_import = f"import {{{imports}}} from 'lucide-react'"
    content = content[:match.start()] + new_import + content[match.end():]

    with open('src/components/admin/AdminViews2.tsx', 'w') as f:
        f.write(content)
    print("Imports patched")
