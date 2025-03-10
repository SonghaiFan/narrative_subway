# Introduction System

This directory contains components for handling user introductions to different scenario types in the application.

## Overview

The introduction system has been updated to use localStorage instead of cookies for tracking whether a user has completed the introduction. This change was made to address issues with third-party cookie constraints in modern browsers.

## Components

### IntroductionFactory

The main component that creates introduction pages for different scenarios with consistent localStorage handling and redirection logic.

```tsx
<IntroductionFactory
  scenarioType="pure-text"
  redirectPath="/pure-text/main"
  cookieName="hasCompletedIntro"
  cookieExpiration={604800} // 7 days in seconds
/>
```

### IntroductionPage

Displays the introduction content for a specific scenario type.

### IntroRedirectChecker

A client component that checks if the user has completed the introduction and redirects to the appropriate introduction page if not. This component is used in conjunction with the middleware to handle redirects based on localStorage.

### IntroRedirectLayout

A layout component that includes the IntroRedirectChecker. This should be used in the layout of pages that require introduction.

```tsx
<IntroRedirectLayout>
  <YourPageContent />
</IntroRedirectLayout>
```

## Implementation

1. **Update your middleware.ts file**:
   The middleware now sets a special header that tells the client to check localStorage for introduction completion.

2. **Add the IntroRedirectLayout to your scenario layouts**:
   For each scenario type, wrap your page content with the IntroRedirectLayout component.

   ```tsx
   // Example: src/app/pure-text/layout.tsx
   import { IntroRedirectLayout } from "@/components/features/introduction/intro-redirect-layout";

   export default function PureTextLayout({ children }) {
     return <IntroRedirectLayout>{children}</IntroRedirectLayout>;
   }
   ```

3. **Use the IntroductionFactory for introduction pages**:
   For each introduction page, use the IntroductionFactory component.

   ```tsx
   // Example: src/app/pure-text/introduction/page.tsx
   import { IntroductionFactory } from "@/components/features/introduction/introduction-factory";

   export default function PureTextIntroductionPage() {
     return (
       <IntroductionFactory
         scenarioType="pure-text"
         redirectPath="/pure-text/main"
       />
     );
   }
   ```

## How It Works

1. When a user visits a page that requires introduction, the middleware sets a special header.
2. The IntroRedirectChecker component checks for this header and then checks localStorage to see if the user has completed the introduction.
3. If the user hasn't completed the introduction, they are redirected to the appropriate introduction page.
4. When the user completes the introduction, the IntroductionFactory component sets a flag in localStorage and redirects to the main content.

## Local Storage Keys

- `hasCompletedIntro`: Boolean flag indicating whether the user has completed the introduction.
- `hasCompletedIntro_expiration`: Timestamp indicating when the introduction completion flag expires.

## Dashboard Integration

The UserDataViewer component in the dashboard has been updated to display both localStorage items and their expiration timestamps, making it easier to debug and manage user data.
