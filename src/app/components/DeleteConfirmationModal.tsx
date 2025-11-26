// src/app/components/DeleteConfirmationModal.tsx
import React from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  message,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  // Fondo oscuro que cubre toda la pantalla (overlay)
  const backdropStyle = "fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300";

  return (
    <div className={backdropStyle}>
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 mx-4 transform transition-transform duration-300 scale-100">
        <h3 className="text-xl font-bold text-red-600 mb-4 border-b pb-2">Confirmar Eliminación</h3>
        
        <p className="text-gray-700 mb-6">{message}</p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;