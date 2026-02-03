'use client';

import { useState } from 'react';

export default function TestPage() {
  const [test, setTest] = useState('');

  return (
    <div>
      <h1>Test</h1>
      <p>{test}</p>
    </div>
  );
}
