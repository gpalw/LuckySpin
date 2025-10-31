import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
            <h1 className="text-6xl font-bold text-gray-800">404</h1>
            <p className="mt-4 text-2xl text-gray-600">页面未找到</p>
            <Link
                to="/"
                className="mt-8 px-6 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
                返回首页
            </Link>
        </div>
    );
};

export default NotFound;