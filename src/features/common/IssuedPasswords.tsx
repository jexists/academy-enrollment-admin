"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export interface Issued {
  name: string;
  email: string;
  password: string;
}

/** 새로 만든 계정의 임시 비밀번호는 이 창에서 한 번만 보여 준다 (결과를 꼭 봐야 하는 일 = Modal) */
export function IssuedPasswords({
  open,
  title,
  issued,
  linked = [],
  onClose,
}: {
  open: boolean;
  title: string;
  issued: Issued[];
  linked?: string[];
  onClose: () => void;
}) {
  const toast = useToast();
  const text = issued
    .map((i) => `${i.name} ${i.email} ${i.password}`)
    .join("\n");
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              void navigator.clipboard
                .writeText(text)
                .then(() => toast.success("복사했어요"));
            }}
          >
            복사
          </Button>
          <Button onClick={onClose}>확인</Button>
        </>
      }
    >
      <p>
        임시 비밀번호는 지금 한 번만 보여요. 전달하면 첫 로그인 때 바꾸게 돼요.
      </p>
      <ul className="mt-4 flex flex-col divide-y divide-line">
        {issued.map((item) => (
          <li
            key={item.email}
            className="flex items-center gap-3 py-2 text-body-sm"
          >
            <span className="w-16 font-medium text-fg">{item.name}</span>
            <span className="flex-1 truncate text-muted">{item.email}</span>
            <code className="rounded bg-s1 px-2 py-0.5 font-mono text-fg">
              {item.password}
            </code>
          </li>
        ))}
      </ul>
      {linked.length > 0 && (
        <p className="mt-3 text-meta text-info">
          이미 가입한 학부모 계정을 이 가족에 연결했어요: {linked.join(", ")}
        </p>
      )}
    </Modal>
  );
}
