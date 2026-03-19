// app/admin/roms/page.tsx
'use client';

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';

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

      <FieldSet>
        <FieldLegend>Profile</FieldLegend>
        <FieldDescription>
          This appears on invoices and emails.
        </FieldDescription>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor='title'>Título</FieldLabel>
            <Input id='title' autoComplete='off' aria-invalid />
            <FieldLabel htmlFor='title'>Descrição</FieldLabel>
            <Input id='title' autoComplete='off' aria-invalid />
          </Field>
        </FieldGroup>
      </FieldSet>
    </div>
  );
}
