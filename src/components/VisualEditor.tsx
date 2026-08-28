import { useRef, useEffect, useState, ChangeEvent } from 'react';
import { Bold, Italic, Strikethrough, List, Image as ImageIcon } from 'lucide-react';

interface VisualEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function VisualEditor({ value, onChange, placeholder, minHeight = "150px" }: VisualEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Track active formats
  const [activeStyles, setActiveStyles] = useState<Record<string, boolean>>({});

  // Track if we are currently updating the value internally to prevent cursor jumps
  const isInternalChange = useRef(false);

  const updateActiveStyles = () => {
    setActiveStyles({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
    });
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      if (document.activeElement === editorRef.current) {
        updateActiveStyles();
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Set initial value on mount
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = value;
    }
  }, []); // Run only on mount

  // Sync external changes
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (value !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = value;
      }
    }
    // Reset internal change flag asynchronously to avoid race conditions
    const timeout = setTimeout(() => {
      isInternalChange.current = false;
    }, 50);
    return () => clearTimeout(timeout);
  }, [value]);

  const exec = (command: string, val: string | undefined = undefined) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
      updateActiveStyles();
    }
    editorRef.current?.focus();
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image is too large. Max size is 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      // Add custom styles to images to ensure they don't break layout and are responsive
      const imgHtml = `<img src="${base64}" style="max-width: 100%; max-height: 400px; object-fit: contain; border: 4px solid black; margin: 8px 0;" />`;
      exec('insertHTML', imgHtml);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
      updateActiveStyles();
    }
  };

  return (
    <div className="flex flex-col border-4 border-black bg-white w-full h-full">
      <div className="flex flex-wrap items-center gap-2 border-b-4 border-black p-2 bg-gray-50 shrink-0">
        <button type="button" onClick={() => exec('bold')} className={`p-2 border-2 border-black transition-colors ${activeStyles.bold ? 'bg-purple-300' : 'bg-white hover:bg-gray-200'}`} title="Bold">
          <Bold size={16} />
        </button>
        <button type="button" onClick={() => exec('italic')} className={`p-2 border-2 border-black transition-colors ${activeStyles.italic ? 'bg-purple-300' : 'bg-white hover:bg-gray-200'}`} title="Italic">
          <Italic size={16} />
        </button>
        <button type="button" onClick={() => exec('strikeThrough')} className={`p-2 border-2 border-black transition-colors ${activeStyles.strikeThrough ? 'bg-purple-300' : 'bg-white hover:bg-gray-200'}`} title="Strikethrough">
          <Strikethrough size={16} />
        </button>
        <button type="button" onClick={() => exec('insertUnorderedList')} className={`p-2 border-2 border-black transition-colors ${activeStyles.insertUnorderedList ? 'bg-purple-300' : 'bg-white hover:bg-gray-200'}`} title="Bullet List">
          <List size={16} />
        </button>
        <div className="relative overflow-hidden inline-block ml-auto">
          <button type="button" className="flex items-center gap-1 p-2 border-2 border-black bg-purple-100 hover:bg-purple-200 text-xs font-black uppercase tracking-widest" title="Upload Image">
            <ImageIcon size={16} /> Image
          </button>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>
      </div>
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={updateActiveStyles}
        onMouseUp={updateActiveStyles}
        className="p-4 outline-none font-medium text-base overflow-y-auto flex-1 prose-img:max-w-full prose-ul:list-disc prose-ul:pl-6"
        style={{ minHeight }}
        data-placeholder={placeholder}
      />
      <style>{`
        div[contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          display: block;
        }
      `}</style>
    </div>
  );
}
