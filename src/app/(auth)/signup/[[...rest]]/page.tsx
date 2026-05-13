import { SignUp } from '@clerk/nextjs';

const clerkAuthAppearance = {
  elements: {
    footer: 'hidden',
    footerPages: 'hidden',
    footerPageLink: 'hidden',
  },
};

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background px-4 py-8">
      <SignUp
        path="/signup"
        routing="path"
        signInUrl="/signin"
        forceRedirectUrl="/"
        appearance={clerkAuthAppearance}
      />
    </div>
  );
}
