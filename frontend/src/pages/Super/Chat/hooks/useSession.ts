import { useState, useEffect, useCallback } from 'react';
import {
  getSession,
  getModels,
  updateModel,
  updatePersona,
  ChatSession,
  ModelConfig,
} from '../../../api/chat';
import { getPersonaTemplates, PersonaTemplate } from '../../../api/persona';

export function useSession() {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [personas, setPersonas] = useState<PersonaTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionRes, modelsRes, personasRes] = await Promise.all([
        getSession(),
        getModels(),
        getPersonaTemplates(),
      ]);
      setSession(sessionRes.session);
      setModels(modelsRes.models);
      setPersonas(personasRes.templates);
    } catch (error) {
      console.error('Failed to load session data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const changeModel = useCallback(async (modelId: string) => {
    try {
      const res = await updateModel(modelId);
      setSession(res.session);
    } catch (error) {
      console.error('Failed to update model:', error);
      throw error;
    }
  }, []);

  const changePersona = useCallback(async (personaId: number) => {
    try {
      const res = await updatePersona(personaId);
      setSession(res.session);
    } catch (error) {
      console.error('Failed to update persona:', error);
      throw error;
    }
  }, []);

  return {
    session,
    models,
    personas,
    loading,
    changeModel,
    changePersona,
    refresh: loadData,
  };
}
