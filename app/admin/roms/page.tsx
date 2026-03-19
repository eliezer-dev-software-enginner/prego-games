// app/admin/roms/page.tsx
'use client';

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function Page() {
  const [roms, setRoms] = useState([]);

  useEffect(() => {
    fetch('/api/admin/roms')
      .then((res) => res.json())
      .then(setRoms);
  }, []);

  return (
    <div>
      <h1>Admin - Jogos</h1>
      <ul>
        {roms.map((rom: any) => (
          <li key={rom.id}>{rom.titulo}</li>
        ))}
      </ul>
    </div>
  );
}
