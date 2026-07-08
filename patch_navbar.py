with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

import re

# find:
#       const { data } = await supabase.from('notifications')
#        .select('*').limit(500)
#        .eq('user_id', userProfile.id)
#        .order('created_at', { ascending: false })

new_fetch = """      const { data } = await supabase.from('notifications')
        .select('*').limit(500)
        .eq('user_id', userProfile.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })"""

content = re.sub(r"const\s+\{\s*data\s*\}\s*=\s*await\s+supabase\.from\('notifications'\)\s*\.select\('\*'\)\.limit\(500\)\s*\.eq\('user_id',\s*userProfile\.id\)\s*\.order\('created_at',\s*\{\s*ascending:\s*false\s*\}\)", new_fetch, content)

with open('src/components/Navbar.tsx', 'w') as f:
    f.write(content)
print("Patched Navbar fetch")
