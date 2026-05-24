'use client';
import { useEditorStore } from '@/lib/store';
import TextControls from './TextControls';
import BackgroundControls from './BackgroundControls';
import ImageControls from './ImageControls';
import FormatSelector from './FormatSelector';
import ExportPanel from './ExportPanel';

export default function PropertiesPanel() {
  const { getSelectedLayer, activePanel } = useEditorStore();
  const selected = getSelectedLayer();

  if (activePanel === 'export') {
    return (
      <aside style={{ width: 280, background: '#0d0d24', borderLeft: '1px solid #1e1e40', display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0, overflowY: 'auto' }}>
        <ExportPanel />
      </aside>
    );
  }

  return (
    <aside style={{ width: 280, background: '#0d0d24', borderLeft: '1px solid #1e1e40', display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0 }}>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {!selected && <FormatSelector />}
        {selected?.type === 'text' && <TextControls />}
        {selected?.type === 'background' && <BackgroundControls />}
        {(selected?.type === 'logo' || selected?.type === 'asset') && <ImageControls />}
      </div>
    </aside>
  );
}
