import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Trash2, HardDrive, AlertCircle, CheckCircle, Database } from "lucide-react";
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

interface DatabaseCleanupResult {
  task: string;
  records_deleted: number;
}

function StorageCleanupPage() {
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [loadingDatabase, setLoadingDatabase] = useState(false);
  const [storageStats, setStorageStats] = useState<CleanupStats | null>(null);
  const [databaseStats, setDatabaseStats] = useState<DatabaseCleanupResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCleanup = async () => {
    if (!confirm("Tem certeza? Arquivos órfãos serão permanentemente deletados!")) {
      return;
    }

    setLoadingStorage(true);
    setError(null);
    setStorageStats(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/storage-cleanup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro na limpeza");
      }

      setStorageStats(data.stats);
      toast.success(
        `✅ Storage limpo! ${data.stats.deleted_files} arquivos removidos, ${data.stats.space_freed_mb} MB liberados`,
      );
    } catch (err: any) {
      const message = err.message || "Erro desconhecido";
      setError(message);
      toast.error("Erro: " + message);
    } finally {
      setLoadingStorage(false);
    }
  };

  const handleDatabaseCleanup = async () => {
    if (
      !confirm(
        "Tem certeza? Dados órfãos do banco serão permanentemente deletados! (Pedidos > 1 ano, conversas > 6 meses, carrinhos > 90 dias)",
      )
    ) {
      return;
    }

    setLoadingDatabase(true);
    setError(null);
    setDatabaseStats(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/database-cleanup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro na limpeza");
      }

      setDatabaseStats(data.stats);
      const total = data.summary?.total_records_deleted || 0;
      toast.success(
        `✅ Banco limpo! ${total} registros órfãos removidos, ~${data.summary?.estimated_space_freed_mb} MB liberados`,
      );
    } catch (err: any) {
      const message = err.message || "Erro desconhecido";
      setError(message);
      toast.error("Erro: " + message);
    } finally {
      setLoadingDatabase(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <HardDrive size={28} className="text-orange-500" />
          Limpeza Completa
        </h1>
        <p className="text-gray-600 mt-1">
          Remove arquivos órfãos e dados desnecessários do banco e storage
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-900 font-semibold">❌ Erro:</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Storage Cleanup Section */}
      <div className="border-2 border-orange-200 rounded-lg p-6 bg-orange-50">
        <h2 className="text-2xl font-bold text-orange-900 flex items-center gap-2 mb-4">
          <HardDrive size={24} />
          Limpeza de Storage
        </h2>
        <p className="text-orange-800 mb-4">
          Remove arquivos órfãos não referenciados por produtos ou configurações
        </p>
        <button
          onClick={handleCleanup}
          disabled={loadingStorage}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-lg transition-all"
        >
          {loadingStorage ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Limpando Storage...
            </>
          ) : (
            <>
              <Trash2 size={18} />
              Iniciar Limpeza de Storage
            </>
          )}
        </button>

        {/* Storage Results */}
        {storageStats && (
          <div className="mt-4 space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Limpeza Concluída!</p>
                <p className="text-sm text-green-800">
                  {storageStats.deleted_files} arquivos removidos, {storageStats.space_freed_mb} MB
                  liberados
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white border border-orange-200 rounded-lg p-3 text-center">
                <p className="text-xs text-orange-600 font-bold">Órfãos Encontrados</p>
                <p className="text-2xl font-bold text-orange-900">{storageStats.orphaned_files}</p>
              </div>
              <div className="bg-white border border-orange-200 rounded-lg p-3 text-center">
                <p className="text-xs text-orange-600 font-bold">Deletados</p>
                <p className="text-2xl font-bold text-orange-900">{storageStats.deleted_files}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Database Cleanup Section */}
      <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
        <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2 mb-4">
          <Database size={24} />
          Limpeza do Banco de Dados
        </h2>
        <p className="text-blue-800 mb-4">
          Remove dados antigos e órfãos (pedidos &gt; 1 ano, conversas &gt; 6 meses, carrinhos &gt;
          90 dias)
        </p>
        <button
          onClick={handleDatabaseCleanup}
          disabled={loadingDatabase}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold rounded-lg transition-all"
        >
          {loadingDatabase ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Limpando Banco...
            </>
          ) : (
            <>
              <Trash2 size={18} />
              Iniciar Limpeza do Banco
            </>
          )}
        </button>

        {/* Database Results */}
        {databaseStats && (
          <div className="mt-4 space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Limpeza Concluída!</p>
                <p className="text-sm text-green-800">
                  {databaseStats.reduce((s, r) => s + (r.records_deleted || 0), 0)} registros
                  removidos
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {databaseStats.map((stat, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-blue-200 rounded-lg p-3 flex justify-between"
                >
                  <p className="text-sm text-blue-900 font-semibold">{stat.task}</p>
                  <p className="text-sm font-bold text-blue-600">
                    {stat.records_deleted || 0} registros
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        <p className="font-semibold text-gray-900 mb-2">ℹ️ Informações:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>
            <strong>Storage:</strong> Remove imagens não referenciadas por produtos
          </li>
          <li>
            <strong>Banco:</strong> Remove dados muito antigos e conversas encerradas
          </li>
          <li>Cada limpeza é segura e reversível</li>
          <li>Recomenda-se fazer backup antes se quiser</li>
          <li>Pode levar alguns segundos dependendo do volume</li>
        </ul>
      </div>
    </div>
  );
}
