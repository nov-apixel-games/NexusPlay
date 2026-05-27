const fs = require('fs');

const FILE_PATH = 'src/components/NexusHub.tsx';
let content = fs.readFileSync(FILE_PATH, 'utf8');

// Replace CommunitiesDashboard Return
const commDashReturnStart = content.indexOf(`  return (
    <div className="flex flex-col h-[100dvh] w-full relative z-10 bg-[#06070a]">`);

let i = commDashReturnStart;
let bracketCount = 0;
let inReturn = false;
while (i < content.length) {
    if (content[i] === '(' && content.substring(i-7, i) === 'return ') {
        inReturn = true;
    }
    if (inReturn) {
        if (content[i] === '(') bracketCount++;
        else if (content[i] === ')') {
            bracketCount--;
            if (bracketCount === 0) {
                break;
            }
        }
    }
    i++;
}
const commDashReturnEnd = i + 2;


const newCommDashUI = `
  return (
    <div className="flex flex-col h-[100dvh] w-full relative z-10 bg-[#020202] overflow-hidden">
      {/* Sci-fi Overlay Elements */}
      <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
      <div className="absolute top-0 w-full h-[500px] bg-gradient-to-b from-cyan-900/20 via-blue-900/10 to-transparent pointer-events-none"></div>

      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 sticky top-0 z-30 bg-black/40 backdrop-blur-md border-b border-cyan-900/50">
        <div className="flex items-center gap-3 sm:gap-4">
           <button onClick={onBack} className="w-10 h-10 sm:w-12 sm:h-12 bg-black/50 border border-cyan-500/30 hover:bg-cyan-900/40 rounded-xl flex items-center justify-center transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)]">
             <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
           </button>
           <div className="relative">
             <h1 className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">Nexus_Net</h1>
             <p className="text-[8px] sm:text-[10px] text-cyan-400 font-mono tracking-widest bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800 absolute -bottom-3 sm:-bottom-1 left-0">SYS.ONLINE</p>
           </div>
        </div>
        <button onClick={onCreateClick} className="px-3 py-2 sm:px-5 sm:py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase text-[10px] sm:text-xs tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(34,211,238,0.6)] animate-pulse flex items-center gap-1.5">
           <Plus className="w-4 h-4"/> <span className="hidden sm:inline">INICIAR SERVER</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-32">
        <div className="max-w-7xl mx-auto space-y-12 mt-8">
           {/* Active/Trending Showcase */}
           <section>
             <h2 className="text-xs sm:text-sm font-black text-cyan-500 uppercase tracking-widest mb-6 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"><Flame className="w-4 h-4 sm:w-5 sm:h-5"/> SECTORES DESTACADOS</h2>
             <div className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-6 pt-2 px-2 -mx-2">
               {recommended.map((c: any) => (
                 <div key={c.id} onClick={() => onSelect(c)} className="snap-center shrink-0 w-[280px] sm:w-[400px] h-[200px] sm:h-[240px] rounded-[24px] relative group cursor-pointer border border-cyan-500/20 hover:border-cyan-400 shadow-[0_0_30px_rgba(0,0,0,0.8)] hover:shadow-[0_0_40px_rgba(34,211,238,0.3)] overflow-hidden transition-all duration-300">
                    <img src={c.image_url} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 mix-blend-screen" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    <div className="absolute top-4 right-4 bg-black/80 border border-cyan-500/50 text-cyan-400 px-2 py-1 rounded text-[9px] font-black tracking-widest shadow-[0_0_10px_rgba(34,211,238,0.5)] uppercase animate-pulse">
                      LIVE
                    </div>
                    <div className="absolute bottom-6 left-6 right-6">
                       <h3 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] mb-1 leading-tight">{c.name}</h3>
                       <p className="text-[10px] sm:text-xs text-cyan-400 font-mono opacity-90 truncate bg-cyan-900/30 inline-block px-2 py-0.5 rounded border border-cyan-800/50">{c.category}</p>
                    </div>
                 </div>
               ))}
             </div>
           </section>

           {/* All Communities as Sci-fi Panels */}
           <section>
             <h2 className="text-xs sm:text-sm font-black text-cyan-500 uppercase tracking-widest mb-6 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"><Zap className="w-4 h-4 sm:w-5 sm:h-5"/> DATABANKS GLOBALES</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {communities.map((c: any) => (
                  <div key={c.id} onClick={() => onSelect(c)} className="group bg-black/60 backdrop-blur-md border border-cyan-900/50 hover:border-cyan-400/80 rounded-[20px] p-4 sm:p-5 cursor-pointer transition-all hover:bg-cyan-950/20 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] flex gap-4 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 blur-2xl group-hover:bg-cyan-500/20 transition-all rounded-full pointer-events-none"></div>
                     <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-black rounded-[14px] border border-cyan-800 overflow-hidden relative shadow-inner">
                        {c.image_url ? (
                           <img src={c.image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 mix-blend-screen group-hover:scale-110 transition-transform duration-500"/>
                        ) : (
                           <div className="w-full h-full flex items-center justify-center">
                              <span className="text-cyan-800 font-black text-2xl group-hover:text-cyan-500 transition-colors uppercase">{c.name[0]}</span>
                           </div>
                        )}
                     </div>
                     <div className="flex-1 flex flex-col justify-center min-w-0 z-10">
                        <h4 className="text-base sm:text-lg font-black text-white truncate uppercase tracking-tight group-hover:text-cyan-400 drop-shadow-sm">{c.name}</h4>
                        <p className="text-[10px] sm:text-[11px] text-gray-500 font-mono mt-1 line-clamp-1">{c.description}</p>
                        <div className="flex items-center gap-2 mt-3">
                           <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#0ff] bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-900">Activo</span>
                           {isAdmin && (
                             <button onClick={(e) => { e.stopPropagation(); onDelete(c.id); }} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" title="Eliminar Base">
                               <Trash2 className="w-4 h-4"/>
                             </button>
                           )}
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           </section>
        </div>
      </main>
    </div>
  );
`;

content = content.substring(0, commDashReturnStart) + newCommDashUI + content.substring(commDashReturnEnd);

// Replace ChatRoom Return
const chatRoomReturnStart = content.indexOf(`  return (
    <div className="flex h-full w-full bg-[#0a0b14] overflow-hidden relative">`);

let j = chatRoomReturnStart;
bracketCount = 0;
inReturn = false;
while (j < content.length) {
    if (content[j] === '(' && content.substring(j-7, j) === 'return ') {
        inReturn = true;
    }
    if (inReturn) {
        if (content[j] === '(') bracketCount++;
        else if (content[j] === ')') {
            bracketCount--;
            if (bracketCount === 0) {
                break;
            }
        }
    }
    j++;
}
const chatRoomReturnEnd = j + 2;

const newChatRoomUI = `
  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[#030303] overflow-hidden relative font-sans">
      
       {/* Sci background */}
       <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
       
       <header className="shrink-0 bg-black/90 backdrop-blur-xl border-b border-cyan-900/80 flex flex-col justify-center px-2 sm:px-6 py-2 sm:py-4 z-20 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
          <div className="flex items-center justify-between mb-3 mt- safe-top">
             <div className="flex items-center gap-2 sm:gap-4 flex-1 overflow-hidden">
                <button onClick={onBack} className="p-2 sm:p-2.5 border border-cyan-900 rounded-lg text-cyan-500 hover:bg-cyan-950/50 hover:text-cyan-300 transition-colors shrink-0 shadow-inner">
                   <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <div className="flex items-center gap-3 min-w-0" onClick={() => setIsSidebarOpen(true)}>
                   <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black border border-cyan-500/50 rounded-[10px] shrink-0 overflow-hidden shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                      {currentCommunity.image_url ? (
                        <img src={currentCommunity.image_url} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-cyan-400 font-black text-xl uppercase">{currentCommunity.name[0]}</div>
                      )}
                   </div>
                   <div className="min-w-0">
                      <h2 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] truncate">{currentCommunity.name}</h2>
                      <p className="text-[9px] sm:text-[10px] font-mono text-cyan-400 capitalize flex items-center gap-1.5 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                        {onlineCount} EN RED
                      </p>
                   </div>
                </div>
             </div>
             
             {/* HUD elements */}
             <div className="hidden sm:flex items-center gap-4 shrink-0 border-l border-cyan-900/50 pl-4 ml-4">
                 <div className="text-right">
                    <p className="text-[9px] font-mono text-cyan-500 uppercase tracking-widest opacity-80">Identidad</p>
                    <p className="text-xs font-black text-white uppercase tracking-wider">{session.user.email?.split('@')[0]}</p>
                 </div>
                 <div className="w-10 h-10 rounded bg-cyan-950/40 border border-cyan-800 flex items-center justify-center shadow-inner">
                    <Users className="w-5 h-5 text-cyan-400" />
                 </div>
             </div>
          </div>
          
          {/* Top Channel Bar */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
             {channels.map(chanName => (
               <button 
                  key={chanName}
                  onClick={() => setActiveChannel(chanName)}
                  className={\`px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-[8px] transition-all whitespace-nowrap flex items-center gap-1.5
                    \${activeChannel === chanName 
                      ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(34,211,238,0.5)]' 
                      : 'bg-black border border-cyan-900/80 text-cyan-500/70 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-950/20'}
                  \`}
               >
                 <Hash className="w-3 h-3 sm:w-4 sm:h-4 opacity-70" /> {chanName}
               </button>
             ))}
             {isCreatorOrAdmin && (
               <button onClick={() => setShowChannelForm(!showChannelForm)} className="px-3 py-1.5 sm:py-2 bg-black border border-dashed border-cyan-800 text-cyan-600 hover:text-cyan-400 hover:border-cyan-400 rounded transition-colors text-xs font-bold shrink-0">
                  + RECEPTOR
               </button>
             )}
          </div>
       </header>

       {/* Floating form for new channel */}
       {showChannelForm && (
         <div className="absolute top-[120px] left-0 w-full bg-cyan-950/90 backdrop-blur-md border-b border-cyan-500/50 p-3 z-30 flex justify-center shadow-2xl">
             <form onSubmit={handleCreateChannel} className="flex gap-2 w-full max-w-sm">
               <input type="text" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} placeholder="NUEVO_CANAL" maxLength={16}
                 className="flex-1 bg-black border border-cyan-500/80 text-cyan-400 font-mono text-xs px-3 py-2 rounded focus:outline-none uppercase placeholder:text-cyan-900 shadow-inner" />
               <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 font-black text-xs rounded uppercase tracking-widest shadow-[0_0_10px_rgba(34,211,238,0.5)] shrink-0">SETEAR</button>
             </form>
         </div>
       )}

       {/* Error Hologram */}
       <AnimatePresence>
         {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} 
               className="absolute top-[140px] left-1/2 -translate-x-1/2 z-50 bg-red-950/90 border border-red-500 text-red-100 px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
              {errorMsg}
              <button onClick={() => setErrorMsg(null)} className="ml-2 hover:text-white"><X className="w-4 h-4" /></button>
            </motion.div>
         )}
       </AnimatePresence>

       <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 flex flex-col gap-5 sm:gap-6 relative z-10 scrollbar-hide">
         
         {/* Welcome Hologram */}
         {filteredMessages.length === 0 && (
           <div className="flex flex-col items-center justify-center my-auto animate-pulse">
              <div className="w-20 h-20 bg-cyan-950/30 rounded-full flex items-center justify-center border border-cyan-900/50 shadow-[0_0_30px_rgba(34,211,238,0.1)] mb-4">
                 <Lock className="w-8 h-8 text-cyan-700" />
              </div>
              <p className="text-cyan-600 font-mono text-[10px] uppercase tracking-widest">TRANSMISIÓN VACÍA</p>
           </div>
         )}

         {filteredMessages.map((msg, index) => {
             const parsed = parseMessageContent(msg.content);
             const isOwn = msg.user_id === session.user.id;
             const isAI = parsed.text?.startsWith('[NEXUS AI]');
             const displayText = isAI ? parsed.text.replace('[NEXUS AI]', '').trim() : parsed.text;
             const showAvatar = true; 
             const msgReactions = getRenderReactions(msg.id);

             return (
               <div key={msg.id} className={\`flex w-full \${(isOwn && !isAI) ? 'justify-end' : 'justify-start'}\`}>
                  <div className={\`flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[75%] \${(isOwn && !isAI) ? 'flex-row-reverse' : 'flex-row'}\`}>
                     
                     {/* Cyber Avatar Bubble */}
                     <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-black border border-cyan-800 rounded-[8px] flex items-center justify-center p-0.5 relative shadow-inner overflow-hidden mt-2">
                        {isAI ? (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-black text-indigo-400 flex items-center justify-center">
                             <Bot className="w-4 h-4 sm:w-5 sm:h-5 " />
                          </div>
                        ) : msg.profiles?.avatar_url ? (
                          <img src={msg.profiles.avatar_url} className="w-full h-full object-cover rounded-[5px] grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all"/>
                        ) : <span className="text-cyan-500 font-mono font-bold text-xs sm:text-sm">{msg.profiles?.username?.[0]?.toUpperCase()}</span>}
                     </div>

                     {/* Content Bubble HUD */}
                     <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className={\`flex items-baseline gap-2 \${(isOwn && !isAI) ? 'justify-end flex-row-reverse' : 'justify-start'}\`}>
                           {isAI ? (
                             <span className="text-[9px] sm:text-[11px] font-black italic text-indigo-400 uppercase tracking-widest text-shadow-[0_0_5px_rgba(99,102,241,0.5)]">AI.SYS</span>
                           ) : (
                             <span className="text-[10px] sm:text-[12px] font-black text-cyan-100 tracking-wider">{(msg.profiles?.username || 'USER').toUpperCase()}</span>
                           )}
                           <span className="text-[8px] sm:text-[9px] font-mono text-cyan-800 tracking-widest">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        
                        <div className={\`relative px-3 py-2 sm:px-4 sm:py-3 border \${
                          isAI ? 'bg-indigo-950/20 border-indigo-500/20 rounded-b-xl rounded-tr-xl shadow-[0_4px_20px_rgba(99,102,241,0.05)]' :
                          (isOwn ? 'bg-cyan-950/30 border-cyan-500/20 rounded-b-xl rounded-tl-xl text-right shadow-[0_4px_15px_rgba(34,211,238,0.05)]' : 'bg-[#0a0c12]/80 border-cyan-900/40 rounded-b-xl rounded-tr-xl')
                        }\`}>
                           {msg.deleted ? (
                             <p className="text-[11px] font-mono text-red-500/70 italic flex items-center justify-center gap-2">
                               <AlertTriangle className="w-3 h-3" /> DATOS PURGADOS
                             </p>
                           ) : (
                             <>
                               {displayText && (
                                 <div className={\`text-[13px] sm:text-[14px] leading-relaxed \${isAI ? 'text-indigo-200' : 'text-gray-300'} font-sans break-words whitespace-pre-wrap\`}>{displayText}</div>
                               )}
                               
                               {parsed.image_url && (
                                 <img src={parsed.image_url} onClick={() => window.open(parsed.image_url||'', '_blank')} className="mt-3 w-full max-w-[200px] sm:max-w-[280px] rounded-lg border border-cyan-900/50 hover:border-cyan-500/50 grayscale hover:grayscale-0 transition-all cursor-pointer shadow-lg" />
                               )}

                               {/* HUD Hover Options */}
                               {!msg.deleted && (
                                 <div className={\`absolute top-2 \${(isOwn && !isAI) ? '-left-8' : '-right-8'} opacity-0 opacity-100 flex flex-col gap-1 transition-opacity\`}>
                                    <button onClick={() => deleteMessage(msg.id)} className="w-6 h-6 bg-red-950/80 border border-red-900 rounded flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors" title="Borrar">
                                       <Trash2 className="w-3 h-3" />
                                    </button>
                                 </div>
                               )}
                             </>
                           )}
                           
                           {/* Rendered Reactions */}
                           {msgReactions.length > 0 && !msg.deleted && (
                             <div className={\`flex gap-1.5 mt-2 flex-wrap \${(isOwn && !isAI) ? 'justify-end' : 'justify-start'}\`}>
                               {msgReactions.map(([emoji, meta]: any) => (
                                 <button key={emoji} onClick={() => handleToggleReaction(msg.id, emoji)} className={\`text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors \${meta.active ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'bg-black/50 text-gray-500 border border-cyan-900/50 hover:border-cyan-700'}\`}>
                                    <span>{emoji}</span> <span>{meta.count}</span>
                                 </button>
                               ))}
                             </div>
                           )}
                        </div>
                        
                        {/* Quick react HUD (always visible minimal on mobile) */}
                        {!msg.deleted && (
                            <div className={\`flex gap-1 mt-1 \${(isOwn && !isAI) ? 'justify-end' : 'justify-start'}\`}>
                              {['👍', '🔥', '😆'].map(emoji => (
                                 <button key={emoji} onClick={() => handleToggleReaction(msg.id, emoji)} className="text-[12px] opacity-60 hover:opacity-100 hover:scale-110 active:scale-90 transition-all mr-1">{emoji}</button>
                              ))}
                           </div>
                        )}
                        
                     </div>
                  </div>
               </div>
             )
         })}
         <div ref={messagesEndRef} className="h-6" />
       </main>

       {/* Cyber Input Area */}
       <div className="p-3 sm:p-5 shrink-0 relative bg-black border-t border-cyan-900/50 z-20 pb-safe">
           {chatImagePreviewUrl && (
             <div className="absolute bottom-full left-4 bg-[#0a0c10]/95 backdrop-blur-md border border-cyan-800 p-2 rounded-t-xl flex gap-3 items-center shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
                <img src={chatImagePreviewUrl} className="w-14 h-14 object-cover rounded-lg border border-cyan-900" />
                <button onClick={() => {setChatImageFile(null); setChatImagePreviewUrl(null);}} className="w-6 h-6 bg-red-950 rounded-full flex items-center justify-center text-red-500 hover:text-red-300 transition-colors"><X className="w-3 h-3"/></button>
             </div>
           )}

           <form onSubmit={handleSendMessage} className="flex gap-2 sm:gap-3 relative max-w-5xl mx-auto items-stretch">
              <input type="file" id="hud-file" className="hidden" accept="image/*" onChange={(e)=>{
                if(e.target.files&&e.target.files[0]){
                  setChatImageFile(e.target.files[0]);
                  setChatImagePreviewUrl(URL.createObjectURL(e.target.files[0]));
                }
              }} />
              <label htmlFor="hud-file" className="w-[45px] sm:w-[50px] bg-cyan-950/40 border border-cyan-800/80 text-cyan-500 flex justify-center items-center cursor-pointer hover:bg-cyan-900/80 hover:border-cyan-400 hover:text-cyan-400 transition-all rounded-[12px] shadow-inner shrink-0 group">
                 <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform"/>
              </label>

              <div className="flex-1 relative flex items-center">
                 <input 
                   type="text" 
                   value={newMessage} 
                   onChange={e=>setNewMessage(e.target.value)} 
                   placeholder="TRANSMITIR MENSAJE..." 
                   className="w-full h-full bg-[#0a0c10] border border-cyan-800/80 text-cyan-300 font-mono text-[11px] sm:text-xs px-4 focus:outline-none focus:border-cyan-500 focus:bg-[#0d1017] transition-all shadow-inner rounded-[12px] placeholder:text-cyan-900/80" 
                 />
                 <div className="absolute right-3 w-1.5 h-1.5 bg-cyan-700 rounded-full animate-pulse pointer-events-none"></div>
              </div>
              
              <button type="submit" disabled={(!newMessage.trim() && !chatImageFile) || isSending} className="w-[80px] sm:w-[120px] bg-cyan-500 text-black font-black uppercase text-[10px] sm:text-xs hover:bg-cyan-400 hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 transition-all rounded-[12px] disabled:opacity-30 disabled:hover:scale-100 disabled:pointer-events-none shadow-[0_0_20px_rgba(34,211,238,0.2)] shrink-0">
                 <span className="hidden sm:inline">ENVIAR</span>
                 <Send className="w-4 h-4" />
              </button>
           </form>
       </div>
    </div>
  );
`;

content = content.substring(0, chatRoomReturnStart) + newChatRoomUI + content.substring(chatRoomReturnEnd);

fs.writeFileSync(FILE_PATH, content, 'utf8');
console.log('Successfully rewrote UI');
