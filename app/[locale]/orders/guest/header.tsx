'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useSettingStore from '@/hooks/use-setting-store';

export default function GuestOrderHeader() {
  const router = useRouter();
  const { setting } = useSettingStore();
  
  return (
    <header className="border-b py-4">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.back()}
            className="hidden md:flex"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <Link href="/" className="flex items-center">
            <Image 
              src={setting.site?.logo || '/icons/logo.svg'} 
              alt={setting.site?.name || 'TradeBiz'} 
              width={120} 
              height={40} 
              className="h-10 w-auto"
            />
          </Link>
        </div>
        
        <Link href="/">
          <Button variant="ghost" size="sm">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
      </div>
    </header>
  );
} 