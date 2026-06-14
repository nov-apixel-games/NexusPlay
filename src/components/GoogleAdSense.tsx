import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function GoogleAdSense() {
  useEffect(() => {
    async function fetchConfig() {
      const { data } = await supabase.from('settings').select('value').eq('key', 'ads_config').single();
      if (data && data.value) {
        const { publisherId, active } = data.value;
        if (active && publisherId) {
          const scriptId = 'google-adsense-script';
          
          // Evitar duplicados
          if (document.getElementById(scriptId)) return;

          const script = document.createElement('script');
          script.async = true;
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
          script.crossOrigin = 'anonymous';
          script.id = scriptId;
          
          document.head.appendChild(script);
;
        }
      }
    }
    fetchConfig();
  }, []);

  return null;
}
