import { SignIn } from '@clerk/nextjs';

const clerkAuthAppearance = {
  elements: {
    footer: 'hidden',
    footerPages: 'hidden',
    footerPageLink: 'hidden',
  },
};

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-background px-4 py-8">
      <SignIn
        path="/signin"
        routing="path"
        signUpUrl="/signup"
        forceRedirectUrl="/"
        appearance={clerkAuthAppearance}
      />
    </div>
  );
}
