"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  ROLE_LABELS,
  USER_TYPE_LABELS,
  USER_TYPES,
  type Role,
  type UserType,
} from "@/lib/roles";

type UserDetailsFieldsProps = {
  defaultValues?: {
    employeeId: string;
    fullName: string;
    role: Role;
    userType: UserType | null;
  };
  roleOptions: Role[];
  roleLocked?: boolean;
};

export function UserDetailsFields({
  defaultValues,
  roleOptions,
  roleLocked = false,
}: UserDetailsFieldsProps) {
  const [role, setRole] = useState<Role>(defaultValues?.role ?? "user");
  const roleIsFixed = roleLocked || roleOptions.length === 1;

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="employeeId">Employee ID</Label>
        <Input
          id="employeeId"
          name="employeeId"
          defaultValue={defaultValues?.employeeId}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          defaultValue={defaultValues?.fullName}
          autoComplete="off"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="role">Role</Label>
        {roleIsFixed ? (
          <>
            <input type="hidden" name="role" value={role} />
            <p id="role" className="text-sm">
              {ROLE_LABELS[role]}
            </p>
            {roleLocked && (
              <p className="text-sm text-muted-foreground">
                You can&apos;t change your own role.
              </p>
            )}
          </>
        ) : (
          <Select
            id="role"
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value as Role)}
          >
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {ROLE_LABELS[option]}
              </option>
            ))}
          </Select>
        )}
      </div>

      {role === "user" && (
        <div className="space-y-1.5">
          <Label htmlFor="userType">User type</Label>
          <Select
            id="userType"
            name="userType"
            defaultValue={defaultValues?.userType ?? ""}
            required
          >
            <option value="" disabled>
              Choose a user type
            </option>
            {USER_TYPES.map((type) => (
              <option key={type} value={type}>
                {USER_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </div>
      )}
    </>
  );
}
