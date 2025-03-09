// apps/dashboard/src/hooks/guild/use.guild.context.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface GuildContextType {
  guildId: string;
  setGuildId: (id: string) => void;
}

const GuildContext = createContext<GuildContextType>({
  guildId: '',
  setGuildId: () => {}
});

export const GuildProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // Lese die Guild-ID aus der Umgebungsvariable oder aus dem lokalen Storage
  const getInitialGuildId = (): string => {
    // Zuerst aus dem lokalen Speicher versuchen
    const savedGuildId = typeof window !== 'undefined' ? localStorage.getItem('guildId') : null;
    
    if (savedGuildId) {
      console.log(`Guild ID aus lokalem Speicher geladen: ${savedGuildId}`);
      return savedGuildId;
    }
    
    // Fallback zur Umgebungsvariable
    const envGuildId = process.env.NEXT_PUBLIC_GUILD_ID;
    console.log(`Guild ID aus Umgebungsvariable: ${envGuildId || 'nicht gefunden'}`);
    
    return envGuildId || '';
  };
  
  const [guildId, setGuildIdState] = useState<string>(getInitialGuildId());
  
  // Wrapper für setGuildId, der auch im lokalen Speicher speichert
  const setGuildId = (id: string) => {
    if (id && typeof window !== 'undefined') {
      localStorage.setItem('guildId', id);
    }
    setGuildIdState(id);
  };
  
  // Protokollieren der Guild-ID bei Änderungen
  useEffect(() => {
    if (guildId) {
      console.log(`Aktive Guild ID: ${guildId}`);
    }
  }, [guildId]);

  return (
    <GuildContext.Provider value={{ guildId, setGuildId }}>
      {children}
    </GuildContext.Provider>
  );
};

export const useGuildContext = () => useContext(GuildContext);
