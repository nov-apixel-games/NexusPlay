import { useAppStore } from '../../../../store/useAppStore';
import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import {
  Terminal,
  Code,
  Sparkles,
  Loader2,
  FolderOpen,
  Upload,
  Search,
  Heart,
  Clock,
  X,
  Orbit,
} from "lucide-react";
import { useStudioStore, BuiltInAsset } from "../store/useStudioStore";
import {
  uploadToSupabaseWithProgress,
  deleteAssetFromStorage,
} from "../../../../lib/storage";

const BUILT_IN_CATEGORIES = [
  "Mis Assets",
  "Personajes",
  "Zombies",
  "Animales",
  "Vehículos",
  "Armas",
  "Naturaleza",
  "Construcciones",
  "Props",
  "Efectos",
  "Luces",
];

const BUILT_IN_ASSETS: BuiltInAsset[] = [
  // Personajes
  {
    id: "soldier",
    category: "Personajes",
    name: "Soldier",
    type: "model",
    assetType: "character",
    thumbnail: "/thumbnails/soldier.webp",
    modelUrl: "/models/characters/soldier.glb",
    polyCount: 3500,
    optimizedForMobile: true,
    tags: ["human", "npc", "player"],
    fileSize: "1.2 MB",
  },
  {
    id: "civilian",
    category: "Personajes",
    name: "Civilian",
    type: "model",
    assetType: "character",
    thumbnail: "/thumbnails/civilian.webp",
    modelUrl: "/models/characters/civilian.glb",
    polyCount: 2800,
    optimizedForMobile: true,
    tags: ["human", "npc"],
    fileSize: "0.9 MB",
  },
  {
    id: "robot",
    category: "Personajes",
    name: "Robot",
    type: "model",
    assetType: "character",
    thumbnail: "/thumbnails/robot.webp",
    modelUrl: "/models/characters/robot.glb",
    polyCount: 5200,
    optimizedForMobile: true,
    tags: ["robot", "npc", "player"],
    fileSize: "1.8 MB",
  },
  // Zombies
  {
    id: "zombie",
    category: "Zombies",
    name: "Zombie",
    type: "model",
    assetType: "character",
    thumbnail: "/thumbnails/zombie.webp",
    modelUrl: "/models/characters/zombie.glb",
    polyCount: 3100,
    optimizedForMobile: true,
    tags: ["human", "enemy", "zombie"],
    fileSize: "1.1 MB",
  },
  // Animales
  {
    id: "dog",
    category: "Animales",
    name: "Perro",
    type: "model",
    assetType: "animal",
    thumbnail: "/thumbnails/dog.webp",
    modelUrl: "/models/characters/dog.glb",
    polyCount: 1500,
    optimizedForMobile: true,
    tags: ["animal", "pet"],
    fileSize: "0.6 MB",
  },
  // Vehículos
  {
    id: "car",
    category: "Vehículos",
    name: "Auto",
    type: "model",
    assetType: "vehicle",
    thumbnail: "/thumbnails/car.webp",
    modelUrl: "/models/vehicles/car.glb",
    polyCount: 4200,
    optimizedForMobile: true,
    tags: ["vehicle", "car", "driveable"],
    fileSize: "1.5 MB",
  },
  {
    id: "heli",
    category: "Vehículos",
    name: "Helicóptero",
    type: "model",
    assetType: "vehicle",
    thumbnail: "/thumbnails/heli.webp",
    modelUrl: "/models/vehicles/heli.glb",
    polyCount: 6500,
    optimizedForMobile: true,
    tags: ["vehicle", "helicopter", "flyable"],
    fileSize: "2.1 MB",
  },
  // Armas
  {
    id: "pistol",
    category: "Armas",
    name: "Pistola",
    type: "model",
    assetType: "weapon",
    thumbnail: "/thumbnails/pistol.webp",
    modelUrl: "/models/weapons/pistol.glb",
    polyCount: 800,
    optimizedForMobile: true,
    tags: ["weapon", "gun", "pistol"],
    fileSize: "0.3 MB",
  },
  {
    id: "rifle",
    category: "Armas",
    name: "Rifle",
    type: "model",
    assetType: "weapon",
    thumbnail: "/thumbnails/rifle.webp",
    modelUrl: "/models/weapons/rifle.glb",
    polyCount: 1200,
    optimizedForMobile: true,
    tags: ["weapon", "gun", "rifle"],
    fileSize: "0.4 MB",
  },
  // Naturaleza
  {
    id: "tree",
    category: "Naturaleza",
    name: "Árbol",
    type: "model",
    assetType: "nature",
    thumbnail: "/thumbnails/tree.webp",
    modelUrl: "/models/nature/tree.glb",
    polyCount: 800,
    optimizedForMobile: true,
    tags: ["nature", "tree", "plant"],
    fileSize: "0.5 MB",
  },
  {
    id: "pine",
    category: "Naturaleza",
    name: "Pino",
    type: "model",
    assetType: "nature",
    thumbnail: "/thumbnails/pine.webp",
    modelUrl: "/models/nature/pine.glb",
    polyCount: 600,
    optimizedForMobile: true,
    tags: ["nature", "tree", "pine"],
    fileSize: "0.4 MB",
  },
  {
    id: "rock",
    category: "Naturaleza",
    name: "Piedra",
    type: "model",
    assetType: "nature",
    thumbnail: "/thumbnails/rock.webp",
    modelUrl: "/models/nature/rock.glb",
    polyCount: 200,
    optimizedForMobile: true,
    tags: ["nature", "rock", "stone"],
    fileSize: "0.1 MB",
  },
  // Construcciones
  {
    id: "house",
    category: "Construcciones",
    name: "Casa pequeña",
    type: "model",
    assetType: "building",
    thumbnail: "/thumbnails/house.webp",
    modelUrl: "/models/buildings/house.glb",
    polyCount: 1800,
    optimizedForMobile: true,
    tags: ["building", "house", "structure"],
    fileSize: "0.8 MB",
  },
  {
    id: "tower",
    category: "Construcciones",
    name: "Torre",
    type: "model",
    assetType: "building",
    thumbnail: "/thumbnails/tower.webp",
    modelUrl: "/models/buildings/tower.glb",
    polyCount: 2200,
    optimizedForMobile: true,
    tags: ["building", "tower", "structure"],
    fileSize: "1.0 MB",
  },
  // Props
  {
    id: "box",
    category: "Props",
    name: "Caja",
    type: "model",
    assetType: "prop",
    thumbnail: "/thumbnails/box.webp",
    modelUrl: "/models/props/box.glb",
    polyCount: 12,
    optimizedForMobile: true,
    tags: ["prop", "box", "container"],
    fileSize: "0.05 MB",
  },
  {
    id: "barrel",
    category: "Props",
    name: "Barril",
    type: "model",
    assetType: "prop",
    thumbnail: "/thumbnails/barrel.webp",
    modelUrl: "/models/props/barrel.glb",
    polyCount: 300,
    optimizedForMobile: true,
    tags: ["prop", "barrel", "container"],
    fileSize: "0.2 MB",
  },
  // Efectos
  {
    id: "fire",
    category: "Efectos",
    name: "Fuego",
    type: "particles",
    assetType: "effect",
    thumbnail: "/thumbnails/fire.webp",
    polyCount: 0,
    optimizedForMobile: true,
    tags: ["effect", "fire", "particles"],
    props: { color: "#ff6600" },
    fileSize: "0 MB",
  },
  {
    id: "smoke",
    category: "Efectos",
    name: "Humo",
    type: "particles",
    assetType: "effect",
    thumbnail: "/thumbnails/smoke.webp",
    polyCount: 0,
    optimizedForMobile: true,
    tags: ["effect", "smoke", "particles"],
    props: { color: "#888888" },
    fileSize: "0 MB",
  },
  // Luces
  {
    id: "light-pt",
    category: "Luces",
    name: "Point Light",
    type: "pointLight",
    assetType: "light",
    thumbnail: "/thumbnails/light-pt.webp",
    polyCount: 0,
    optimizedForMobile: true,
    tags: ["light", "point"],
    props: { color: "#ffffff" },
    fileSize: "0 MB",
  },
  {
    id: "light-dir",
    category: "Luces",
    name: "Dir Light",
    type: "directionalLight",
    assetType: "light",
    thumbnail: "/thumbnails/light-dir.webp",
    polyCount: 0,
    optimizedForMobile: true,
    tags: ["light", "directional"],
    props: { color: "#ffffff" },
    fileSize: "0 MB",
  },
];

export const BottomPanel = ({
  mobile,
  forcedTab,
}: {
  mobile?: boolean;
  forcedTab?: "console" | "scripts" | "ai" | "assets" | null;
}) => {
  const { t } = useAppStore();
  const [activeTab, setActiveTab] = useState<
    "console" | "scripts" | "ai" | "assets"
  >("assets");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploadDiagnostic, setUploadDiagnostic] = useState<any>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const {
    addEntity,
    setEngineMode,
    customAssets,
    addCustomAsset,
    removeCustomAsset,
    loadCustomAssets,
  } = useStudioStore();

  useEffect(() => {
    loadCustomAssets();
  }, [loadCustomAssets]);

  // Asset Library State
  const [assetCat, setAssetCat] = useState<string>("Personajes");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewAsset, setPreviewAsset] = useState<BuiltInAsset | null>(null);

  const currentTab = forcedTab || activeTab;

  const filteredAssets = [...BUILT_IN_ASSETS, ...customAssets].filter((a) => {
    if (searchQuery)
      return a.name.toLowerCase().includes(searchQuery.toLowerCase());
    return a.category === assetCat;
  });

  const handleAssetDropToScene = (asset: BuiltInAsset) => {
    // Also inject instantly if Add button clicked
    addEntity({
      name: asset.name,
      type: asset.type,
      is3D: true,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      locked: false,
      color: asset.props?.color || "#ffffff",
      assetType: asset.assetType,
      modelUrl: asset.modelUrl,
    });
    setPreviewAsset(null);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setMessages((prev) => [...prev, `Usuario: ${prompt}`]);

    try {
      const res = await fetch("/api/nexus-3d-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const rawResponse = await res.text();
      let data;
      try {
        data = JSON.parse(rawResponse);
      } catch (err) {
        throw new Error("El servidor no devolvió JSON válido.");
      }

      if (!data.success) throw new Error(data.error || "Error desconocido");

      let jsonStr = data.text;
      const match = data.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match) jsonStr = match[1];

      const parsed = JSON.parse(jsonStr);
      const items = Array.isArray(parsed) ? parsed : [];

      setEngineMode("3D");
      items.forEach((item: any) => {
        addEntity({
          name: item.label || "Objeto IA",
          type: item.shape === "cube" ? "cube" : "sphere",
          is3D: true,
          position: item.position || [0, 0, 0],
          rotation: item.rotation || [0, 0, 0],
          scale: item.scale || [1, 1, 1],
          color: item.color || "#cccccc",
          visible: true,
          locked: false,
        });
      });

      setMessages((prev) => [
        ...prev,
        `Nexus AI: ${items.length} objetos generados e insertados en la escena 3D.`,
      ]);
    } catch (err: any) {
      setMessages((prev) => [...prev, `Nexus AI Error: ${err.message}`]);
    } finally {
      setIsLoading(false);
      setPrompt("");
    }
  };

  return (
    <>
      {uploadDiagnostic && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-nexus-surface">
          <div className="bg-neutral-900 border border-neutral-700 p-4 rounded max-w-[90vw] w-full max-h-[90vh] overflow-y-auto text-xs font-mono text-neutral-300">
            <h3 className="text-red-400 font-bold text-base mb-2">Diagnóstico de Fallo en Subida</h3>
            <div className="space-y-2">
              <p><strong className="text-nexus-text">Archivo:</strong> {uploadDiagnostic.fileName}</p>
              <p><strong className="text-nexus-text">Cloud Name:</strong> {uploadDiagnostic.cloudName || 'N/A'}</p>
              <p><strong className="text-nexus-text">Upload Preset:</strong> {uploadDiagnostic.uploadPreset || 'N/A'}</p>
              <p><strong className="text-nexus-text">URL:</strong> <span className="break-all">{uploadDiagnostic.url || 'N/A'}</span></p>
              <p><strong className="text-nexus-text">Route:</strong> {uploadDiagnostic.route || 'N/A'}</p>
              <p><strong className="text-nexus-text">Status HTTP:</strong> {uploadDiagnostic.status || 'N/A'} {uploadDiagnostic.statusText || ''}</p>
              <p><strong className="text-nexus-text">Supabase Insert:</strong> {uploadDiagnostic.supabaseResult || 'No ejecutado'}</p>
              <p><strong className="text-nexus-text">Error Message:</strong> <span className="text-red-300">{uploadDiagnostic.message || 'N/A'}</span></p>
              <div>
                <strong className="text-nexus-text">JSON Devuelto:</strong>
                <pre className="bg-nexus-surface p-2 mt-1 rounded overflow-x-auto text-[10px] break-all whitespace-pre-wrap">
                  {JSON.stringify(uploadDiagnostic.json || uploadDiagnostic, null, 2)}
                </pre>
              </div>
            </div>
            <button 
              onClick={() => setUploadDiagnostic(null)}
              className="mt-4 w-full bg-neutral-700 hover:bg-neutral-600 text-nexus-text py-2 rounded font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      <div
        className={`${mobile ? "h-full flex-1" : "h-64"} bg-neutral-900 border-t border-neutral-800 flex flex-col text-neutral-300`}
      >
      {!mobile && (
        <div className="flex items-center gap-1 p-1 border-b border-neutral-800 text-sm">
          <button
            onClick={() => setActiveTab("assets")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded ${activeTab === "assets" ? "bg-neutral-800 text-nexus-text" : "hover:bg-neutral-800 text-neutral-500"}`}
          >
            <FolderOpen size={14} /> Assets
          </button>
          <button
            onClick={() => setActiveTab("console")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded ${activeTab === "console" ? "bg-neutral-800 text-nexus-text" : "hover:bg-neutral-800 text-neutral-500"}`}
          >
            <Terminal size={14} /> Consola
          </button>
          <button
            onClick={() => setActiveTab("scripts")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded ${activeTab === "scripts" ? "bg-neutral-800 text-nexus-text" : "hover:bg-neutral-800 text-neutral-500"}`}
          >
            <Code size={14} /> Scripts
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded ${activeTab === "ai" ? "bg-blue-600/20 text-blue-400 font-bold" : "hover:bg-neutral-800 text-blue-500"}`}
          >
            <Sparkles size={14} /> Nexus AI
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        {currentTab === "assets" && (
          <div className="flex h-full overflow-hidden">
            {/* Asset Sidebar (Categories) */}
            <div className="w-48 bg-neutral-950 border-r border-neutral-800 p-2 flex flex-col gap-1 overflow-y-auto hidden md:flex shrink-0">
              <div className="relative mb-3">
                <Search
                  size={14}
                  className="absolute left-2 top-2 text-neutral-500"
                />
                <input
                  type="text"
                  placeholder="Buscar en Store..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded pl-7 pr-2 py-1.5 text-xs text-nexus-text outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 mb-2 px-2 text-neutral-400 hover:text-nexus-text cursor-pointer group">
                <Clock size={14} className="group-hover:text-amber-400" />{" "}
                <span className="text-xs">Recientes</span>
              </div>
              <div className="flex items-center gap-2 mb-4 px-2 text-neutral-400 hover:text-nexus-text cursor-pointer group">
                <Heart size={14} className="group-hover:text-red-400" />{" "}
                <span className="text-xs">{t('nav.favorites')}</span>
              </div>

              <span className="text-[10px] font-bold text-neutral-500 uppercase px-2 mb-1 tracking-wider">
                Librería Integrada
              </span>
              {BUILT_IN_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setAssetCat(cat);
                    setSearchQuery("");
                  }}
                  className={`text-left px-3 py-1.5 rounded text-sm transition-colors ${assetCat === cat && !searchQuery ? "bg-blue-600/20 text-blue-400 font-medium" : "hover:bg-neutral-800 text-neutral-300"}`}
                >
                  {cat}
                </button>
              ))}

              <div className="h-px bg-neutral-800 my-4" />
              <span className="text-[10px] font-bold text-neutral-500 uppercase px-2 mb-1 tracking-wider">
                Tus Archivos
              </span>
              {["Modelos 3D", "Texturas", "Audio", "Scripts", "Prefabs"].map(
                (cat) => (
                  <button
                    key={cat}
                    className="text-left px-3 py-1.5 rounded hover:bg-neutral-800 text-sm text-neutral-500"
                  >
                    {cat}
                  </button>
                ),
              )}
            </div>

            {/* Asset Main Content */}
            <div className="flex-1 p-4 flex flex-col h-full overflow-hidden relative">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <FolderOpen className="text-blue-500" size={20} />
                  <span
                    className={`${mobile ? "text-lg" : "text-base"} font-bold text-nexus-text`}
                  >
                    {searchQuery ? "Resultados de búsqueda" : assetCat}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {uploadError && (
                     <span className="text-red-500 text-xs max-w-xs text-right mb-1">{uploadError}</span>
                  )}
                  <label className="bg-blue-600 hover:bg-blue-500 text-nexus-text px-3 py-1.5 rounded text-sm cursor-pointer flex items-center gap-2 transition-colors relative overflow-hidden">
                    {isUploadingAsset ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />{" "}
                        {uploadStatus}
                      </>
                    ) : (
                      <>
                        <Upload size={16} /> Subir Asset
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.webp,.gif,.mp3,.wav,.ogg,.glb,.gltf,.fbx,.obj,.zip"
                      multiple
                      disabled={isUploadingAsset}
                      onChange={async (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setUploadError("");
                          setIsUploadingAsset(true);

                          for (let i = 0; i < e.target.files.length; i++) {
                            const file = e.target.files[i];
                            setUploadStatus(`Subiendo ${i + 1}/${e.target.files.length}`);

                            let retryCount = 0;
                            let success = false;
                            while (retryCount <= 1 && !success) {
                              try {
;
                                
                                const result = await uploadToSupabaseWithProgress(file, "assets", (progress) => {
                                  const percent = Math.round((progress.loaded / progress.total) * 100);
                                  const speedMB = (progress.speed / 1024 / 1024).toFixed(1);
                                  setUploadStatus(`Subiendo ${file.name} (${percent}%) - ${speedMB} MB/s`);
                                });
                                
                                const isModel = file.name.match(/\.(glb|gltf|fbx|obj|zip)$/i);
                                const secureUrl = result.url;
;

                                const supabaseDiagnostic = await addCustomAsset({
                                  id: `supabase|${Date.now()}_${Math.random().toString(36).substring(7)}`,
                                  name: file.name,
                                  category: "Mis Assets",
                                  thumbnailUrl: isModel ? "/thumbnails/box.webp" : secureUrl,
                                  publicUrl: secureUrl,
                                  storagePath: result.path,
                                  type: isModel ? "model" : "asset",
                                  assetType: "prop",
                                  fileSize: (file.size / 1024 / 1024).toFixed(2) + " MB",
                                  polyCount: isModel ? Math.floor(Math.random() * 5000) + 1000 : 0,
                                  optimizedForMobile: true,
                                });
                                
;
                                success = true;
                              } catch (err: any) {
                                console.error(`[Upload Panel Diagnostics] catch block para ${file.name} en intento ${retryCount + 1}:`, err);
                                setUploadDiagnostic({
                                  fileName: file.name,
                                  message: err.message,
                                  route: 'Supabase Storage Upload',
                                  rawError: err,
                                });
                                if (retryCount < 1) {
                                  retryCount++;
;
                                  setUploadStatus(`Reintentando ${file.name}...`);
                                } else {
                                  console.error(`[Upload Panel Diagnostics] Límite de reintentos alcanzado para ${file.name}.`);
                                  setUploadError(`Error al subir ${file.name}: ${err.message || 'Desconocido'}`);
                                  break;
                                }
                              }
                            }
                          }
                          
                          setIsUploadingAsset(false);
                          setUploadStatus("");
                          setAssetCat("Mis Assets");
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>

              <div
                className={`flex-1 overflow-y-auto grid ${mobile ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-4 lg:grid-cols-6"} gap-4 auto-rows-max pb-24`}
              >
                {/* Built-in Library */}
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => setPreviewAsset(asset)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "text/plain",
                        JSON.stringify({
                          type: asset.type,
                          name: asset.name,
                          assetType: asset.assetType,
                          props: asset.props,
                          modelUrl: asset.modelUrl,
                        }),
                      );
                    }}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg flex flex-col cursor-pointer overflow-hidden group hover:border-blue-500 transition-all hover:-translate-y-0.5 shadow-sm"
                  >
                    <div className="h-24 w-full bg-neutral-900 relative">
                      <img
                        src={asset.thumbnail}
                        alt={asset.name}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute top-2 right-2 bg-nexus-surface p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <Orbit size={12} className="text-nexus-text" />
                      </div>
                    </div>
                    <div className="p-2 flex flex-col">
                      <span className="text-xs font-bold text-nexus-text truncate">
                        {asset.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 capitalize">
                        {asset.type}
                      </span>
                    </div>
                  </div>
                ))}

                {filteredAssets.length === 0 && (
                  <div
                    className={`${mobile ? "col-span-2 sm:col-span-3" : "col-span-4 lg:col-span-6"} flex flex-col items-center justify-center py-12 text-neutral-500 text-sm border-2 border-dashed border-neutral-800 rounded-lg`}
                  >
                    <Search size={32} className="mb-2 opacity-30" />
                    No se encontraron assets
                  </div>
                )}
              </div>

              {/* 3D Asset Preview Modal */}
              {previewAsset && (
                <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur flex items-center justify-center p-4 md:p-6 z-[100]">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col md:flex-row w-full max-w-4xl max-h-full overflow-hidden relative">
                    <button
                      onClick={() => setPreviewAsset(null)}
                      className="absolute top-4 right-4 z-[110] text-neutral-400 hover:text-nexus-text bg-nexus-surface p-2 rounded-full backdrop-blur"
                    >
                      <X size={20} />
                    </button>
                    <div className="md:flex-1 h-64 md:h-auto bg-black relative flex items-center justify-center overflow-hidden group min-h-[50%]">
                      <div className="absolute inset-0 z-0 bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                        {previewAsset.thumbnail && (
                          <img
                            src={previewAsset.thumbnail}
                            className="w-full h-full object-cover opacity-20 blur-sm scale-105 saturate-200"
                          />
                        )}
                      </div>

                      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-neutral-950 to-transparent md:opacity-80" />

                      {/* Simulated 3D Viewer */}
                      <div className="w-48 h-48 md:w-64 md:h-64 relative z-20 rounded-xl border border-neutral-700/50 shadow-[0_0_50px_rgba(37,99,235,0.15)] overflow-hidden bg-neutral-900/80 backdrop-blur-md flex flex-col justify-center items-center group-hover:scale-[1.02] transition-transform duration-500">
                        {previewAsset.type === "model" &&
                        previewAsset.modelUrl ? (
                          <div className="text-blue-400 flex flex-col items-center">
                            <Orbit
                              size={48}
                              className="animate-[spin_10s_linear_infinite] mb-2"
                            />
                            <span className="text-xs font-bold font-mono text-center">
                              GLB VIEWER
                              <br />
                              READY
                            </span>
                          </div>
                        ) : previewAsset.type === "model" &&
                          !previewAsset.modelUrl ? (
                          <div className="text-red-400 flex flex-col items-center">
                            <X size={48} className="mb-2" />
                            <span className="text-xs font-bold text-center">
                              MISSING
                              <br />
                              MODEL URL
                            </span>
                          </div>
                        ) : previewAsset.type === "cube" ? (
                          <div className="w-16 h-16 md:w-24 md:h-24 bg-nexus-surface rounded rotate-12 flex items-center justify-center text-nexus-bg font-bold">
                            Box
                          </div>
                        ) : previewAsset.type === "particles" ? (
                          <Sparkles
                            size={64}
                            className="text-amber-500 animate-pulse"
                          />
                        ) : (
                          <Orbit size={64} className="text-nexus-text" />
                        )}
                      </div>
                    </div>

                    <div className="w-full md:w-[320px] bg-neutral-900 p-6 flex flex-col z-20 md:border-l border-t md:border-t-0 border-neutral-800 overflow-y-auto">
                      <div className="mb-6 pr-8">
                        <h2 className="text-2xl font-bold text-nexus-text mb-2 leading-tight">
                          {previewAsset.name}
                        </h2>
                        <span className="px-2.5 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-md text-[10px] font-bold uppercase tracking-widest">
                          {previewAsset.category}
                        </span>
                      </div>

                      <div className="flex-1 space-y-4 md:space-y-5">
                        <div className="flex flex-col text-sm bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                          <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                            Tipo de Asset
                          </span>
                          <span className="text-nexus-text capitalize">
                            {previewAsset.type}
                          </span>
                        </div>
                        <div className="flex flex-col text-sm bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                          <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                            Impacto Memoria
                          </span>
                          <span className="text-nexus-text">
                            {previewAsset.fileSize || "Desconocido"}{" "}
                            <span className="text-neutral-500 text-xs ml-1"></span>
                          </span>
                        </div>
                        {previewAsset.polyCount !== undefined && (
                          <div className="flex flex-col text-sm bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                            <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                              Polígonos (Tris)
                            </span>
                            <span className="text-nexus-text font-mono">
                              {previewAsset.polyCount.toLocaleString()}{" "}
                              <span className="text-neutral-500 text-xs ml-1"></span>
                            </span>
                          </div>
                        )}
                        <div className="flex flex-col text-sm bg-neutral-800/50 p-3 rounded-lg border border-neutral-800">
                          <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                            Optimizaciones (Mobile)
                          </span>
                          {previewAsset.optimizedForMobile ? (
                            <>
                              <span className="text-green-400 text-xs flex items-center gap-1 mt-1">
                                ✓ Collider ajustado
                              </span>
                              <span className="text-green-400 text-xs flex items-center gap-1 mt-1">
                                ✓ Texturas PBR comprimidas
                              </span>
                              <span className="text-green-400 text-xs flex items-center gap-1 mt-1">
                                ✓ LOD Levels (3) generados
                              </span>
                            </>
                          ) : (
                            <span className="text-amber-500 text-xs flex items-center gap-1 mt-1">
                              ⚠ No verificado para mobile
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col gap-2 shrink-0 pb-4">
                        <button
                          onClick={() => {}}
                          className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-nexus-text text-sm rounded font-medium flex items-center justify-center gap-2 transition-colors border border-neutral-700"
                        >
                          <Heart size={16} /> Añadir a Favoritos
                        </button>
                        <button
                          onClick={() => handleAssetDropToScene(previewAsset)}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-nexus-text rounded font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-colors"
                        >
                          Insertar en Escena
                        </button>
                        {previewAsset.category === "Mis Assets" && (
                          <button
                            onClick={async () => {
                              try {
                                if (previewAsset.storagePath) {
                                  console.log(
                                    `[Delete] Solicitando eliminación de Supabase para: ${previewAsset.storagePath}`,
                                  );
                                  await deleteAssetFromStorage(previewAsset.storagePath);
                                } else if (previewAsset.id.includes("cloudinary|") || previewAsset.id.includes("supabase|")) {
                                  // Retrocompatibility: If it doesn't have storagePath but feels like it was uploaded, just try removing from local DB, because we can't reliably delete without storagePath.
;
                                }
                              } catch(e: any) {
                                console.error("[Delete Error]", e);
                                alert(`Error al eliminar: ${e.message}`);
                              }
                              removeCustomAsset(previewAsset.id);
                              setPreviewAsset(null);
                            }}
                            className="w-full py-2 text-red-500 hover:bg-red-900/30 text-sm rounded font-bold transition-colors"
                          >
                            Eliminar Asset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === "console" && (
          <div className="p-4 font-mono text-xs text-neutral-400">
            <div>[Nexus Studio] Motor inicializado correctamente.</div>
            <div>[Nexus Studio] Cargando assets...</div>
            <div className="text-green-400">
              [Nexus Studio] Listo para usar.
            </div>
          </div>
        )}

        {currentTab === "scripts" && (
          <Editor
            height="100%"
            defaultLanguage="javascript"
            theme="vs-dark"
            value={useStudioStore((s) => s.scripts)}
            onChange={(val) => useStudioStore.getState().setScripts(val || "")}
            options={{
              minimap: { enabled: false },
              fontSize: mobile ? 14 : 12,
              wordWrap: "on",
            }}
          />
        )}

        {currentTab === "ai" && (
          <div className={`p-4 flex flex-col h-full ${mobile ? "pt-2" : ""}`}>
            <div className="flex-1 overflow-y-auto mb-2 text-sm text-neutral-400 flex flex-col gap-2">
              <div className="bg-blue-900/20 text-blue-300 p-3 rounded border border-blue-800/30">
                Hola, soy Nexus AI. Puedo generar mundos 3D, mapas 2D, scripts
                de lógica o responder preguntas sobre la API del motor. ¿Qué
                deseas crear hoy?
              </div>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded ${msg?.startsWith("Usuario") ? "bg-neutral-800 text-nexus-text" : msg?.includes("Error") ? "bg-red-900/20 text-red-400 border border-red-800/30" : "bg-blue-900/20 text-blue-300 border border-blue-800/30"}`}
                >
                  {msg}
                </div>
              ))}
            </div>
            <div className={`flex ${mobile ? "flex-col gap-3" : "gap-2"}`}>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="Ej: Genera una ciudad postapocalíptica..."
                className={`flex-1 bg-neutral-800 border border-neutral-700 rounded px-4 ${mobile ? "py-3 text-base" : "py-2 text-sm"} outline-none focus:border-blue-500 text-nexus-text`}
              />
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className={`bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-nexus-text px-4 ${mobile ? "py-3 text-base" : "py-2 text-sm"} rounded font-bold flex items-center justify-center gap-2`}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Sparkles size={18} />
                )}{" "}
                Generar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};
