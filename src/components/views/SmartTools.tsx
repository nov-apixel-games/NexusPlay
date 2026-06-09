import React, { useState, useEffect } from 'react';
import { X, Save, Copy, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Bloc de notas
export function NotesApp({ onClose }: { onClose: () => void }) {
  const [notes, setNotes] = useState<{id: string; title: string; content: string}[]>(() => {
    const saved = localStorage.getItem('nexus_notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeNote, setActiveNote] = useState<string | null>(notes.length > 0 ? notes[0].id : null);

  useEffect(() => {
    localStorage.setItem('nexus_notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    const newNote = { id: Date.now().toString(), title: 'Nueva Nota', content: '' };
    setNotes([newNote, ...notes]);
    setActiveNote(newNote.id);
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(notes.filter(n => n.id !== id));
    if (activeNote === id) setActiveNote(null);
  };

  const updateNote = (field: 'title' | 'content', value: string) => {
    if (!activeNote) return;
    setNotes(notes.map(n => n.id === activeNote ? { ...n, [field]: value } : n));
  };

  const current = notes.find(n => n.id === activeNote);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-nexus-card w-full max-w-2xl h-[80vh] rounded-2xl flex border border-nexus-border overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-2 right-2 p-2 hover:bg-nexus-bg rounded-lg z-10"><X className="w-5 h-5" /></button>
        
        <div className="w-1/3 border-r border-nexus-border bg-nexus-bg/50 flex flex-col">
          <div className="p-4 border-b border-nexus-border flex justify-between items-center">
            <h3 className="font-bold">Bloc de Notas</h3>
            <button onClick={addNote} className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {notes.map(n => (
              <div key={n.id} onClick={() => setActiveNote(n.id)} className={`p-3 rounded-xl cursor-pointer flex justify-between items-center group ${activeNote === n.id ? 'bg-nexus-card-hover border border-nexus-border' : 'hover:bg-nexus-card-hover/50 border border-transparent'}`}>
                <div className="truncate font-medium text-sm">{n.title || 'Sin Título'}</div>
                <button onClick={(e) => deleteNote(n.id, e)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-400/10 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {notes.length === 0 && <p className="text-center text-nexus-text-sec text-xs mt-10">No hay notas</p>}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col bg-nexus-card">
          {current ? (
            <>
              <input value={current.title} onChange={e => updateNote('title', e.target.value)} className="w-full bg-transparent p-6 pb-2 text-2xl font-bold outline-none placeholder:text-nexus-text-sec" placeholder="Título de la nota" />
              <textarea value={current.content} onChange={e => updateNote('content', e.target.value)} className="w-full flex-1 bg-transparent p-6 outline-none resize-none placeholder:text-nexus-text-sec" placeholder="Escribe aquí..." />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-nexus-text-sec text-sm">Selecciona o crea una nota</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Calculadora
export function CalculatorApp({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const append = (c: string) => {
    if (display === '0' && c !== '.') setDisplay(c);
    else setDisplay(prev => prev + c);
  };

  const calculate = () => {
    try {
      const result = eval(display.replace('x', '*'));
      setEquation(display + ' =');
      setDisplay(String(result));
    } catch {
      setDisplay('Error');
    }
  };

  const clear = () => { setDisplay('0'); setEquation(''); };

  const btns = ['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-nexus-card w-full max-w-sm rounded-[2rem] border border-nexus-border overflow-hidden shadow-2xl relative p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-nexus-bg rounded-lg"><X className="w-5 h-5" /></button>
        <h3 className="font-bold opacity-50 mb-6">Calculadora</h3>
        
        <div className="bg-nexus-bg rounded-2xl p-4 mb-6 flex flex-col items-end min-h-[90px] border border-nexus-border">
          <div className="text-nexus-text-sec text-sm tracking-wider h-5">{equation}</div>
          <div className="text-4xl font-mono tracking-tighter overflow-hidden">{display}</div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {btns.map(b => (
            <button key={b} onClick={() => {
              if (b === 'C') clear();
              else if (b === '=') calculate();
              else append(b);
            }} className={`h-14 rounded-2xl text-xl font-medium transition-colors ${b === '=' ? 'col-span-2 bg-blue-500 text-white hover:bg-blue-600' : ['/','*','-','+','C'].includes(b) ? 'bg-nexus-card-hover text-nexus-accent hover:bg-nexus-border' : 'bg-nexus-bg hover:bg-nexus-card-hover'}`}>
              {b}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// Escáner QR / Generador
export function QrApp({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('https://nexusplay.vercel.app');
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-nexus-card w-full max-w-md rounded-2xl border border-nexus-border overflow-hidden shadow-2xl relative p-6 text-center">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-nexus-bg rounded-lg"><X className="w-5 h-5" /></button>
        <h3 className="font-bold text-xl. mb-2">Código QR</h3>
        <p className="text-sm text-nexus-text-sec mb-6">Genera un QR para compartir rápidamente</p>
        
        <div className="bg-white p-4 rounded-xl inline-block mx-auto mb-6">
           <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`} alt="QR Code" className="w-48 h-48" />
        </div>
        
        <input value={text} onChange={e => setText(e.target.value)} className="w-full bg-nexus-bg border border-nexus-border rounded-xl p-3 text-center" placeholder="Url o Texto..." />
      </motion.div>
    </div>
  );
}

// Conversor de Monedas
export function CurrencyApp({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState('1');
  const [rate] = useState(1.08); // Fixed mocked rate EUR -> USD
  
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-nexus-card w-full max-w-sm rounded-[2rem] border border-nexus-border overflow-hidden shadow-2xl relative p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-nexus-bg rounded-lg"><X className="w-5 h-5" /></button>
        <h3 className="font-bold mb-6">Conversor Moneda</h3>
        
        <div className="space-y-4">
          <div className="bg-nexus-bg p-4 rounded-2xl border border-nexus-border">
             <div className="text-nexus-text-sec text-xs uppercase mb-1">Euros (EUR)</div>
             <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-transparent text-3xl outline-none font-medium" />
          </div>
          
          <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 text-blue-500">
             <div className="text-blue-500/70 text-xs uppercase mb-1">Dólares (USD)</div>
             <div className="text-3xl font-medium">{(parseFloat(amount || '0') * rate).toFixed(2)}</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
