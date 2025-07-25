"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/useUserProfile";
import Toast, { useToast } from "@/components/Toast";
import Image from "next/image";
import { supabase } from '@/lib/supabase'

export default function CompleteProfilePage() {
  const { userProfile, updateProfile, loading, refetchProfile } = useUserProfile();
  const [nome, setNome] = useState(userProfile?.nome || "");
  const [avatar, setAvatar] = useState(userProfile?.avatar || "");
  const [avatarPreview, setAvatarPreview] = useState(userProfile?.avatar || "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <span className="text-lg text-neutral-500">Carregando perfil...</span>
      </div>
    );
  }

  // Handler para upload de imagem local
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Por favor, selecione apenas arquivos de imagem", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("A imagem deve ter no máximo 5MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
      setAvatar(ev.target?.result as string); // Para demo, salva base64. Em produção, faça upload para storage e salve a URL.
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarPreview(e.target.value);
    setAvatar(e.target.value);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      showToast("Por favor, preencha seu nome.", "warning");
      return;
    }
    setSaving(true);
    // 1. Atualizar tabela usuarios
    const { error: dbError } = await updateProfile({ nome, avatar });
    // 2. Atualizar auth.user (user_metadata)
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        name: nome,
        full_name: nome,
        avatar_url: avatar,
        picture: avatar,
      }
    });
    setSaving(false);
    if (dbError || authError) {
      showToast("Erro ao salvar perfil. Tente novamente.", "error");
    } else {
      showToast("Perfil atualizado com sucesso!", "success");
      await refetchProfile();
      setTimeout(() => { window.location.href = "/" }, 800);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 p-4">
      <form
        onSubmit={handleSave}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md space-y-8 border border-neutral-100 flex flex-col items-center"
        style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)' }}
      >
        <h1 className="text-3xl font-extrabold text-neutral-900 text-center mb-1 tracking-tight">
          Complete seu perfil
        </h1>
        <p className="text-neutral-500 text-center mb-4 text-base">
          Para continuar, preencha seu nome e escolha uma foto de perfil.
        </p>
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="mb-2 flex flex-col items-center gap-2">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Avatar preview"
                width={100}
                height={100}
                className="rounded-full border-4 border-primary-200 shadow-lg object-cover"
              />
            ) : (
              <div className="w-[100px] h-[100px] bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-4xl text-primary-400 font-bold">?</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              id="avatar-upload-input"
            />
            <label htmlFor="avatar-upload-input" className="btn-ghost cursor-pointer text-sm mt-1">
              Selecionar imagem
            </label>
            <input
              type="url"
              placeholder="Ou cole a URL da imagem"
              value={avatarPreview}
              onChange={handleAvatarUrl}
              className="input-field mt-2"
            />
            <span className="text-xs text-neutral-400">Formatos aceitos: JPG, PNG, GIF</span>
          </div>
        </div>
        <div className="w-full">
          <label className="block text-sm font-semibold text-neutral-700 mb-2">Nome</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all bg-neutral-50 text-neutral-900 placeholder:text-neutral-400"
            placeholder="Seu nome completo"
            required
            minLength={2}
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={saving || loading}
          className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white py-3 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md mt-2"
        >
          {saving ? "Salvando..." : "Salvar e continuar"}
        </button>
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={hideToast}
        />
      </form>
    </div>
  );
} 