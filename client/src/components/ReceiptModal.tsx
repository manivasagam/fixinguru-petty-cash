import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, ZoomIn } from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl: string | null;
}

export function ReceiptModal({ isOpen, onClose, receiptUrl }: ReceiptModalProps) {
  const handleDownload = () => {
    if (receiptUrl) {
      const link = document.createElement('a');
      link.href = receiptUrl;
      link.download = `receipt-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!receiptUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <ZoomIn className="h-5 w-5" />
              <span>Receipt Preview</span>
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex items-center justify-center p-6 bg-gray-50">
          <img
            src={receiptUrl}
            alt="Receipt"
            className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
            style={{ imageRendering: 'auto' }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
