'use client';

/**
 * ReportReviewDialog Component
 * Modal dialog for reporting a review with reason selection
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Flag, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { reportReview } from '@/lib/api/reviews';
import type { ReportReason, ReviewReportInsert } from '@/types/reviews';
import { REPORT_REASON_LABELS } from '@/types/reviews';

interface ReportReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewId: string;
  userId: string;
}

export default function ReportReviewDialog({
  open,
  onOpenChange,
  reviewId,
  userId,
}: ReportReviewDialogProps) {
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const reportMutation = useMutation({
    mutationFn: (data: ReviewReportInsert) => reportReview(data),
    onSuccess: () => {
      toast.success('신고가 접수되었습니다', {
        description: '관리자가 검토 후 처리할 예정입니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['my-reports'] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error('신고 실패', {
        description: error.message || '신고 처리 중 오류가 발생했습니다.',
      });
    },
  });

  const handleClose = () => {
    setReason('');
    setDescription('');
    onOpenChange(false);
  };

  const handleSubmit = () => {
    if (!reason) {
      toast.error('신고 사유를 선택해주세요');
      return;
    }

    reportMutation.mutate({
      reporter_id: userId,
      target_type: 'review',
      target_id: reviewId,
      reason,
      description: description.trim() || undefined,
    });
  };

  const reasons: ReportReason[] = ['profanity', 'false_info', 'spam', 'other'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            리뷰 신고
          </DialogTitle>
          <DialogDescription>
            부적절한 리뷰를 신고해주세요. 관리자가 검토 후 조치합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Reason Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              신고 사유 <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={reason}
              onValueChange={(value) => setReason(value as ReportReason)}
              className="space-y-2"
            >
              {reasons.map((r) => (
                <div
                  key={r}
                  className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setReason(r)}
                >
                  <RadioGroupItem value={r} id={r} />
                  <Label
                    htmlFor={r}
                    className="flex-1 cursor-pointer text-sm font-normal"
                  >
                    {REPORT_REASON_LABELS[r]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Additional Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              상세 내용 (선택)
            </Label>
            <Textarea
              id="description"
              placeholder="신고 내용을 자세히 설명해주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 text-right">
              {description.length}/500
            </p>
          </div>

          {/* Warning Notice */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              허위 신고 시 서비스 이용이 제한될 수 있습니다.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={reportMutation.isPending}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || reportMutation.isPending}
            className="bg-red-500 hover:bg-red-600"
          >
            {reportMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                처리중...
              </>
            ) : (
              '신고하기'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
