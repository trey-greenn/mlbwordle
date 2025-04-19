'use client'

import { event } from '../lib/gtag';
import { useState } from 'react';

export default function ExampleComponent() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    // Increment counter
    setCount(count + 1);
    
    // Track event
    event({
      action: 'button_click',
      category: 'engagement',
      label: 'example_button',
      value: count + 1,
    });
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={handleClick}>Increment</button>
    </div>
  );
} 