with open('src/components/Navbar.tsx', 'r') as f:
    content = f.read()

import re

# Find the channel subscription block
old_block = """    const channel = supabase.channel('user_notifs')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${userProfile.id}` 
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev].slice(0, 10));
      })
      .subscribe();"""

new_block = """    const channel = supabase.channel('user_notifs')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${userProfile.id}` 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          // Check if it's already expired just in case
          if (new Date(payload.new.expires_at) > new Date()) {
            setNotifications(prev => [payload.new, ...prev].slice(0, 10));
          }
        } else if (payload.eventType === 'DELETE') {
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
        }
      })
      .subscribe();"""

# Because regex match with formatting can be tricky, I'll do a simple replace
# Let's find the `supabase.channel('user_notifs')` and replace everything until `.subscribe();`
match = re.search(r"const channel = supabase\.channel\('user_notifs'\).*?\.subscribe\(\);", content, re.DOTALL)
if match:
    content = content[:match.start()] + new_block + content[match.end():]
    with open('src/components/Navbar.tsx', 'w') as f:
        f.write(content)
    print("Patched realtime")
else:
    print("Match not found")

