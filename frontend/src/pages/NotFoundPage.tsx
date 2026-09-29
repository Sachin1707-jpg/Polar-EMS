import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';

/**
 * 404 Not Found Page Component
 */
export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-polar flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="text-8xl font-bold text-gradient mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">
            Page Not Found
          </h1>
          <p className="text-gray-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary flex items-center justify-center"
          >
            <ArrowLeft size={18} className="mr-2" />
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-primary flex items-center justify-center"
          >
            <Home size={18} className="mr-2" />
            Home
          </button>
        </div>
      </Card>
    </div>
  );
}
