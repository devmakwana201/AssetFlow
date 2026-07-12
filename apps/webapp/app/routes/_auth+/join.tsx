import type {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  MetaFunction,
} from "react-router";
import { redirect, data, useActionData, useNavigation } from "react-router";

import { useZorm } from "react-zorm";
import { z } from "zod";
import { Form } from "~/components/custom-form";

import Input from "~/components/forms/input";
import PasswordInput from "~/components/forms/password-input";
import { Button } from "~/components/shared/button";
import { config } from "~/config/assetflow.config";
import { useSearchParams } from "~/hooks/search-params";
import { useAutoFocus } from "~/hooks/use-auto-focus";
import { getSupabaseAdmin } from "~/integrations/supabase/client";
import { ContinueWithEmailForm } from "~/modules/auth/components/continue-with-email-form";
import {
  signUpWithEmailPass,
  signInWithEmail,
} from "~/modules/auth/service.server";
import {
  getSelectedOrganization,
  setSelectedOrganizationIdCookie,
} from "~/modules/organization/context.server";
import { findUserByEmail, createUser } from "~/modules/user/service.server";
import { generateUniqueUsername } from "~/modules/user/utils.server";
import { appendToMetaTitle } from "~/utils/append-to-meta-title";
import { setCookie } from "~/utils/cookies.server";
import {
  ShelfError,
  isZodValidationError,
  makeShelfError,
  notAllowedMethod,
} from "~/utils/error";
import { isFormProcessing } from "~/utils/form";
import {
  payload,
  error,
  getActionMethod,
  parseData,
  safeRedirect,
} from "~/utils/http.server";
import { validEmail } from "~/utils/misc";
import { validateNonSSOSignup } from "~/utils/sso.server";

export function loader({ context }: LoaderFunctionArgs) {
  const title = "Create an account";
  const subHeading = "Start your journey with AssetFlow";
  const { disableSignup } = config;

  try {
    if (disableSignup) {
      throw new ShelfError({
        cause: null,
        title: "Signup is disabled",
        message:
          "For more information, please contact your workspace administrator.",
        label: "User onboarding",
        status: 403,
        shouldBeCaptured: false,
      });
    }
    if (context.isAuthenticated) {
      return redirect("/assets");
    }

    return data(payload({ title, subHeading }));
  } catch (cause) {
    const reason = makeShelfError(cause);
    throw data(error(reason), { status: reason.status });
  }
}

const JoinFormSchema = z
  .object({
    email: z
      .string()
      .transform((email) => email.toLowerCase())
      .refine(validEmail, () => ({
        message: "Please enter a valid email",
      })),
    password: z
      .string()
      .min(8, "Your password is too short. Min 8 characters are required."),
    confirmPassword: z
      .string()
      .min(8, "Your password is too short. Min 8 characters are required."),
    redirectTo: z.string().optional(),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      return ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password and confirm password must match",
        path: ["confirmPassword"],
      });
    }
  });

export async function action({ context, request }: ActionFunctionArgs) {
  try {
    const method = getActionMethod(request);

    switch (getActionMethod(request)) {
      case "POST": {
        const { email, password, redirectTo } = parseData(
          await request.formData(),
          JoinFormSchema,
          { shouldBeCaptured: false },
        );
        // Block signup if domain uses SSO
        await validateNonSSOSignup(email);

        const existingUser = await findUserByEmail(email);

        if (existingUser) {
          throw new ShelfError({
            cause: null,
            message: "User with this Email already exists, login instead",
            additionalData: { email },
            label: "User onboarding",
            shouldBeCaptured: false,
            status: 409,
          });
        }

        // Create the Supabase auth user
        const supabaseUser = await signUpWithEmailPass(email, password);

        // Auto-confirm email so users can sign in immediately
        await getSupabaseAdmin().auth.admin.updateUserById(supabaseUser.id, {
          email_confirm: true,
        });

        // Establish an auth session for the new user
        const authSession = await signInWithEmail(email, password);

        if (!authSession) {
          throw new ShelfError({
            cause: null,
            message: "Could not sign in after signup. Please try logging in.",
            label: "User onboarding",
            shouldBeCaptured: false,
          });
        }

        // Provision user profile and personal organization
        const username = await generateUniqueUsername(authSession.email);
        await createUser({ ...authSession, username });

        const { organizationId } = await getSelectedOrganization({
          userId: authSession.userId,
          request,
        });

        context.setSession(authSession);

        return redirect(safeRedirect(redirectTo || "/assets"), {
          headers: [
            setCookie(await setSelectedOrganizationIdCookie(organizationId)),
          ],
        });
      }
    }

    throw notAllowedMethod(method);
  } catch (cause) {
    const reason = makeShelfError(
      cause,
      undefined,
      isZodValidationError(cause),
    );
    return data(error(reason), { status: reason.status });
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data ? appendToMetaTitle(data.title) : "" },
];

export default function Join() {
  const zo = useZorm("NewQuestionWizardScreen", JoinFormSchema);
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const navigation = useNavigation();
  const disabled = isFormProcessing(navigation.state);
  const data = useActionData<typeof action>();

  /** Focus the email field on mount (intentional first-field focus on auth pages). */
  const emailInputRef = useAutoFocus<HTMLInputElement>();

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md">
        <Form ref={zo.ref} method="post" className="space-y-6" replace>
          <div>
            <Input
              ref={emailInputRef}
              data-test-id="email"
              label="Email address"
              placeholder="zaans@huisje.com"
              required
              name={zo.fields.email()}
              type="email"
              autoComplete="email"
              disabled={disabled}
              inputClassName="w-full"
              error={zo.errors.email()?.message || data?.error.message}
            />
          </div>

          <PasswordInput
            label="Password"
            placeholder="**********"
            required
            data-test-id="password"
            name={zo.fields.password()}
            autoComplete="new-password"
            disabled={disabled}
            inputClassName="w-full"
            error={zo.errors.password()?.message}
          />
          <PasswordInput
            label="Confirm Password"
            placeholder="**********"
            required
            data-test-id="confirmPassword"
            name={zo.fields.confirmPassword()}
            autoComplete="new-password"
            disabled={disabled}
            inputClassName="w-full"
            error={zo.errors.confirmPassword()?.message}
          />

          <input
            type="hidden"
            name={zo.fields.redirectTo()}
            value={redirectTo}
          />
          <Button
            className="text-center"
            type="submit"
            data-test-id="login"
            disabled={disabled}
            width="full"
          >
            Get Started
          </Button>
        </Form>
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                {"Or use a One Time Password"}
              </span>
            </div>
          </div>
          <div className="mt-6">
            <ContinueWithEmailForm mode="signup" />
          </div>
        </div>
        <div className="flex items-center justify-center pt-5">
          <div className="text-center text-sm text-gray-500">
            {"Already have an account? "}
            <Button
              variant="link"
              to={{
                pathname: "/",
                search: searchParams.toString(),
              }}
            >
              Log in
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
