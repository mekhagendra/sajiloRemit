import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({ value, onChange }: Props) {
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden [&_.ck-editor\_\_editable]:min-h-[300px] [&_.ck-editor\_\_editable]:px-4 [&_.ck-editor\_\_editable]:py-3">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <CKEditor
        editor={ClassicEditor as any}
        data={value}
        onChange={(_event: any, editor: any) => {
          onChange(editor.getData());
        }}
        config={{
          toolbar: [
            'heading', '|',
            'bold', 'italic', 'underline', '|',
            'link', 'blockQuote', '|',
            'bulletedList', 'numberedList', '|',
            'insertTable', '|',
            'undo', 'redo',
          ],
        }}
      />
    </div>
  );
}
