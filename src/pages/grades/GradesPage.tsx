import { useState } from 'react';

import UnitaryGradesTab from '@/pages/grades/UnitaryGradesTab';
import MassiveGradesTab from '@/pages/grades/MassiveGradesTab';

type Tab = 'unitary' | 'massive';

const tabs: { key: Tab; label: string }[] = [
  { key: 'unitary', label: 'Registro unitario' },
  { key: 'massive', label: 'Carga masiva' },
];

export default function GradesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('unitary');

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Calificaciones</h1>
          <p className="text-sm text-gray-500">
            Gestiona calificaciones de forma unitaria o realiza cargas masivas desde archivos.
          </p>
        </div>
      </header>

      <div className="flex gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-gray-900 font-semibold text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'unitary' ? <UnitaryGradesTab /> : <MassiveGradesTab />}
      </div>
    </div>
  );
}

