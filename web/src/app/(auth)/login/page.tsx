import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Gestão Ambiental</h1>
          <p className="text-gray-500 mt-1">Entre na sua conta</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <LoginForm />
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          Não tem conta?{' '}
          <a href="/register" className="text-green-600 font-medium hover:underline">
            Cadastre sua empresa
          </a>
        </p>
      </div>
    </div>
  )
}
