'use client';

import { useState } from 'react';
import ConfigClient from './ConfigClient';
import { Building2 } from 'lucide-react';

interface Lab {
    id: string;
    name: string;
}

interface Props {
    labs: Lab[];
}

export default function ConfigWrapper({ labs }: Props) {
    const [currentLabId, setCurrentLabId] = useState(labs[0]?.id || '');

    return (
        <div className="space-y-4">
            {/* Lab Selector */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Configurando para:</span>
                <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <select
                        value={currentLabId}
                        onChange={(e) => setCurrentLabId(e.target.value)}
                        className="input pl-9 pr-8 py-2 min-w-[250px]"
                    >
                        {labs.map(lab => (
                            <option key={lab.id} value={lab.id}>{lab.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <ConfigClient labId={currentLabId} />
        </div>
    );
}
