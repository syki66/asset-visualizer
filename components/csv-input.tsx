'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { shinhanCsvToJson, shinhanJsonToCleanFormat } from '@/utils/adapter';
import { ChangeEvent } from 'react';

export default function csvInput() {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const shinhanJson = shinhanCsvToJson(text);
          const cleanJson = shinhanJsonToCleanFormat(shinhanJson);
          console.log(cleanJson);
        }
      };
      reader.readAsText(file);
    } else {
      console.log('Please upload a valid CSV file.');
    }
  };

  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="picture">import CSV File</Label>
      <Input
        id="picture"
        type="file"
        accept=".csv"
        onChange={handleFileChange}
      />
    </div>
  );
}
