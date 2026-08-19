import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Trash2, HardDrive, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/storage-cleanup")({
  component: StorageCleanupPage,
});

interface CleanupStats {
  total_files: number;
  referenced_files: number;
  orphaned_files: number;
  deleted_files: number;
  space_freed_mb: string;
}

function StorageCleanupPage() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCleanup = async () => {
    if (!confirm("Tem certeza? Arquivos órfãos serão permanentemente deletados!")) {
      return;
    }

    setLoading(true);
    setError(null);
    setStats(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/storage-cleanup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro na limpeza");
      }

      setStats(data.stats);
      toast.success(
        `✅ Limpeza concluída! ${data.stats.deleted_files} arquivos removidos, ${data.stats.space_freed_mb} MB liberados`
      );
    } catch (err: any) {
      const message = err.message || "Erro desconhecido";
      setError(message);
      toast.error("Erro: " + message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <HardDrive size={28} className="text-orange-500" />
          Limpeza de Storage
        </h1>
        <p className="text-gray-600 mt-1">
          Remove arquivos órfãos não relacionados a nenhum produto
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
        <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-900">Como funciona:</p>
          <p className="text-sm text-blue-800 mt-1">
            Este processo verifica todos os arquivos no storage e identifica aqueles que não são
            referenciados por nenhum produto ou configuração. Esses arquivos "órfãos" são então
            removidos para liberar espaço.
          </p>
        </div>
      </div>

      {/* Main Button */}
      <button
        onClick={handleCleanup}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-lg transition-all"
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Limpando...
          </>
        ) : (
          <>
            <Trash2 size={18} />
            Iniciar Limpeza
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-900 font-semibold">❌ Erro:</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Results */}
      {stats && (
        <div className="mt-8 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
            <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Limpeza Concluída com Sucesso!</p>
              <p className="text-sm text-green-800 mt-1">
                {stats.deleted_files} arquivos órfãos foram removidos
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-600 uppercase font-bold">Total de Arquivos</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_files}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-600 uppercase font-bold">Referenciados</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{stats.referenced_files}</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-600 uppercase font-bold">Órfãos Encontrados</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">{stats.orphaned_files}</p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs text-orange-600 uppercase font-bold">Deletados</p>
              <p className="text-2xl font-bold text-orange-900 mt-1">{stats.deleted_files}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 col-span-2">
              <p className="text-xs text-green-600 uppercase font-bold">Espaço Liberado</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{stats.space_freed_mb} MB</p>
            </div>
          </div>

          {/* Success Message */}
          <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
            <p className="text-green-800 font-semibold">
              ✅ {stats.space_freed_mb} MB de espaço liberado com sucesso!
            </p>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        <p className="font-semibold text-gray-900 mb-2">ℹ️ Informações:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Apenas arquivos órfãos são removidos</li>
          <li>Imagens de galeria são preservadas</li>
          <li>O processo é seguro e reversível (faça backup antes se quiser)</li>
          <li>Pode levar alguns segundos dependendo da quantidade de arquivos</li>
        </ul>
      </div>
    </div>
  );
}
