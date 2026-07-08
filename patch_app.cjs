const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// remove isAdminVerified state
content = content.replace(/const \[isAdminVerified, setIsAdminVerified\] = useState\(false\);\n?/, '');

// remove first useEffect
const useEffect1Str = `  useEffect(() => {
    if (activeView === 'admin-panel' && isAdminVerified) {
      const interval = setInterval(() => {
        if (Date.now() - lastAdminActivity > 5 * 60 * 1000) { // 5 minutes inactivity
          setIsAdminVerified(false);
          setActiveView('home');
          addToast("Sesión de administrador cerrada por inactividad", "info");
        }
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [activeView, isAdminVerified, lastAdminActivity, addToast]);`;
content = content.replace(useEffect1Str, '');

// remove second useEffect
const useEffect2Str = `  useEffect(() => {
    const handleActivity = () => {
      if (activeView === 'admin-panel') {
        setLastAdminActivity(Date.now());
      }
    };
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [activeView]);`;
content = content.replace(useEffect2Str, '');

// remove modal render
const modalStr = `        if (!isAdminVerified) {
          return (
            <DoubleVerificationModal 
               user={session?.user} 
               onSuccess={() => setIsAdminVerified(true)} 
               onFail={() => { setActiveView('home'); addToast('Biometría de seguridad rechazada.', 'error'); }} 
               onClose={() => setActiveView('home')} 
            />
          );
        }`;
content = content.replace(modalStr, '');

// remove unused imports
content = content.replace(/import DoubleVerificationModal from '\.\/components\/admin\/DoubleVerificationModal';\n?/, '');
content = content.replace(/const \[lastAdminActivity, setLastAdminActivity\] = useState\(Date.now\(\)\);\n?/, '');

fs.writeFileSync('src/App.tsx', content);
