'use client';

import { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

interface Genre {
  id: string;
  name: string;
}

export default function GenresPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Genre>({
    id: '',
    name: ''
  });

  // 장르 목록 불러오기
  const fetchGenres = async () => {
    try {
      const response = await fetch('/api/genres');
      if (!response.ok) throw new Error('Failed to fetch genres');
      const data = await response.json();
      setGenres(data);
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  // 장르 생성
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/genres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const newGenre = await response.json();
      setGenres(prev => [...prev, newGenre]);
      setFormData({ id: '', name: '' });
    } catch (error) {
      console.error('Error creating genre:', error);
      alert(error instanceof Error ? error.message : '장르 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 장르 수정
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/genres', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const updatedGenre = await response.json();
      setGenres(prev =>
        prev.map(genre => (genre.id === updatedGenre.id ? updatedGenre : genre))
      );
      setFormData({ id: '', name: '' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating genre:', error);
      alert(error instanceof Error ? error.message : '장르 수정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 장르 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 장르를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/genres?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      setGenres(prev => prev.filter(genre => genre.id !== id));
    } catch (error) {
      console.error('Error deleting genre:', error);
      alert(error instanceof Error ? error.message : '장르 삭제에 실패했습니다.');
    }
  };

  // 수정 모드 시작
  const handleEdit = (genre: Genre) => {
    setFormData(genre);
    setIsEditing(true);
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setFormData({ id: '', name: '' });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">장르 관리</h1>
        
        {/* 장르 추가/수정 폼 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={isEditing ? handleUpdate : handleCreate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="id" className="block text-sm font-medium text-gray-700">
                  ID (영문)
                </label>
                <input
                  type="text"
                  id="id"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase() })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                  placeholder="k-pop"
                  required
                  disabled={isEditing}
                />
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  이름 (한글)
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                  placeholder="케이팝"
                  required
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
              >
                {isLoading ? '처리 중...' : isEditing ? '수정' : '추가'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-400 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  취소
                </button>
              )}
            </div>
          </form>
        </div>

        {/* 장르 목록 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {genres.map((genre) => (
                <tr key={genre.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {genre.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {genre.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(genre)}
                      className="text-blue-600 hover:text-blue-900 mx-2"
                      title="수정"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(genre.id)}
                      className="text-red-600 hover:text-red-900 mx-2"
                      title="삭제"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
