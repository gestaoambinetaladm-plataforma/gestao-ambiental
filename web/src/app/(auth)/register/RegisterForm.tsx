'use client'

import { useState } from 'react'
import { registerAction } from '@/lib/auth/actions'

export default function RegisterForm() {
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  // Gera slug automático a partir do nome da empresa
  function handleCompanyNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const slugInput = document.getElementById('slug') as HTMLInputElement
    if (slugInput) {
      slugInput.value = e.target.value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await registerAction(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da empresa</label>
        <input
          name="companyName"
          type="text"
          required
          onChange={handleCompanyNameChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Consultoria Ambiental Ltda"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Identificador único
          <span className="text-gray-400 font-normal ml-1">(URL da sua empresa)</span>
        </label>
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent">
          <span className="bg-gray-50 px-3 py-2 text-sm text-gray-500 border-r border-gray-300 shrink-0">
            app.gestao/
          </span>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            pattern="^[a-z0-9-]+$"
            className="flex-1 px-3 py-2 text-sm focus:outline-none"
            placeholder="consultoria-ambiental"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">Apenas letras minúsculas, números e hífens</p>
      </div>

      <hr className="border-gray-100" />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Seu nome</label>
        <input
          name="name"
          type="text"
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="João Silva"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="joao@empresa.com.br"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Criando conta...' : 'Criar conta grátis'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Ao criar sua conta você concorda com os termos de uso e política de privacidade.
      </p>
    </form>
  )
}
