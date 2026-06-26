import RegisterForm from './RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Gestão Ambiental</h1>
          <p className="text-gray-500 mt-1">Cadastre sua empresa e comece grátis por 14 dias</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <RegisterForm />
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem conta?{' '}
          <a href="/login" className="text-green-600 font-medium hover:underline">
            Fazer login
          </a>
        </p>
      </div>
    </div>
  )
}
