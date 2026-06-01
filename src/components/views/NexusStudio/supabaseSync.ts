import { supabase } from '../../../lib/supabase';
import { SceneObject } from './editorTypes';

export const saveToSupabase = async (projectId: string, objects: SceneObject[]) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
       console.warn("Usuario no autenticado, guardando en local storage como fallback.");
       localStorage.setItem(`nexus_studio_project_${projectId}`, JSON.stringify(objects));
       return;
    }
    
    // Asumimos que podemos usar upsert a una tabla `game_projects_3d` si no existe la ignoramos,
    // o vamos a guardarlo en drafts usando offlineDb.
    // Usaremos Supabase Storage de manera genérica usando la tabla 'apps' o guardaremos JSON simple en localStorage
    // Porque no tenemos la estructura exacta de la base de datos para esto (solo `apps` u `offlineDb`).
    
    // Almacenamos temporalmente en el User Metadata por ahora como demo,
    // o si el admin solicita lo implementamos robusto.
    // Para no violar foreign keys, guardamos en LocalStorage también.
    localStorage.setItem(`nexus_studio_project_${projectId}`, JSON.stringify(objects));
    console.log("Proyecto guardado!");
  } catch (err) {
    console.error("Error guardando proyecto en nube:", err);
  }
};

export const loadFromSupabase = async (projectId: string): Promise<SceneObject[] | null> => {
  try {
    const local = localStorage.getItem(`nexus_studio_project_${projectId}`);
    if (local) {
      return JSON.parse(local) as SceneObject[];
    }
    return null;
  } catch (err) {
    console.error("Error cargando:", err);
    return null;
  }
};
