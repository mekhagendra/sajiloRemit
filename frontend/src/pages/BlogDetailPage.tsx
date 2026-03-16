import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBlogById } from '../api';

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) { navigate('/blogs', { replace: true }); return; }
    getBlogById(id)
      .then((res) => {
        const url: string = res.data.blog?.sourceUrl;
        if (url) {
          window.location.replace(url);
        } else {
          navigate('/blogs', { replace: true });
        }
      })
      .catch(() => navigate('/blogs', { replace: true }));
  }, [id, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <span className="text-gray-400 text-sm">Redirecting…</span>
    </div>
  );
}
