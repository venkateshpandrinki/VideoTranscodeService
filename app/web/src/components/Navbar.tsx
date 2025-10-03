'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, Video, Upload } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="w-full bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 backdrop-blur-sm border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg group-hover:from-purple-600 group-hover:to-blue-700 transition-all duration-200">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              VideoTranscode
            </span>
          </Link>

          {/* Right: Auth controls */}
          <div className="flex items-center space-x-4">
            {!session ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => signIn('google')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200"
              >
                Sign In
              </Button>
            ) : (
              <div className="flex items-center space-x-3">
                {/* Upload Button - visible when logged in */}
                <Link href="/upload">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white border-0 shadow-lg transition-all duration-200"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Upload</span>
                  </Button>
                </Link>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 text-white hover:bg-white/10 transition-all duration-200"
                    >
                      <Avatar className="w-8 h-8 ring-2 ring-white/20">
                        <AvatarImage src={session.user?.image || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-sm">
                          {session.user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline font-medium">
                        {session.user?.name || 'User'}
                      </span>
                      <Menu className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl"
                  >
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="cursor-pointer text-red-600"
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
