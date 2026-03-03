import { useState } from 'react';
import YearProgramPanel from './YearProgramPanel';
import TermAndGenerationPanel from './TermAndGenerationPanel';
import InvitationsPanel from './InvitationsPanel';
import ChangePasswordPanel from './ChangePasswordPanel';
import CsvImportPanel from './CsvImportPanel';
import TimeSlotSettingsPanel from './TimeSlotSettingsPanel';

export default function SettingsPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="fixed right-4 top-20 z-20 bg-blue-800 text-white px-3 py-2 rounded" onClick={() => setOpen((v) => !v)}>
        {open ? 'Close Settings' : 'Open Settings'}
      </button>
      {open && (
        <aside className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-slate-50 border-l overflow-y-auto z-10 p-4">
          <h2 className="text-lg font-semibold mb-3">Settings</h2>
          <YearProgramPanel />
          <TermAndGenerationPanel />
          <TimeSlotSettingsPanel />
          <CsvImportPanel />
          <InvitationsPanel />
          <ChangePasswordPanel />
        </aside>
      )}
    </>
  );
}
