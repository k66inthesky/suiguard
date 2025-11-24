import ComparisonCard from '@/components/ComparisonCard';
import PageLayout from '@/components/layout/PageLayout';
import { BASE_URL, FEATURES } from '@/constants';
import { isValidSuiPackageId } from '@/utils';
import { useState } from 'react';

export default function PackageCheckPage() {
  const [result, setResult] = useState<{
    package_ids: string[];
    cur_pkg_id: string;
    cur_pkg_version: number;
    cur_pkg_time: string;
    last_pkg_id: string;
    last_pkg_version: number;
    last_pkg_time: string;
    timestamp: string;
  } | null>(null);
  const [resultError, setResultError] = useState<boolean>(false);
  const [input, setInput] = useState<{
    value: string;
    submitBtnText: string;
    submitStatus: boolean;
    isLatest: boolean;
    checked: boolean;
    inputError?: string;
  }>({
    value: '',
    submitBtnText: 'Search',
    submitStatus: false,
    isLatest: false,
    checked: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput((prev) => ({
      ...prev,
      value: e.target.value,
    }));
  };

  const handleButtonClick = async () => {
    const packageIdInput =
      (document.getElementById('packageIdInput') as HTMLInputElement)?.value ?? '';

    setInput((prev) => ({
      ...prev,
      value: packageIdInput,
      submitStatus: true,
      submitBtnText: 'Checking...',
    }));

    // TODO: support multiple package ids input
    const ids = packageIdInput.split(',').map((id) => id.trim());
    if (!ids.every(isValidSuiPackageId)) {
      setInput((prev) => ({
        ...prev,
        submitStatus: false,
        submitBtnText: 'Search',
        inputError: 'Package ID not valid',
      }));
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/analyze-versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          package_ids: [...ids],
        }),
      });

      if (!res.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await res.json();
      const { results, timestamp } = data;
      const {
        CUR_PKG_ID: cur_pkg_id,
        CUR_PKG_VERSION: cur_pkg_version,
        CUR_PKG_TIME: cur_pkg_time,
        LAST_PKG_ID: last_pkg_id,
        LAST_PKG_VERSION: last_pkg_version,
        LAST_PKG_TIME: last_pkg_time,
      } = results[0];

      if (results && results.length > 0) {
        if (typeof results[0] === 'string') {
          setResult(null);
          setInput((prev) => ({ ...prev, isLatest: true }));
        } else {
          setResult((prev) => ({
            ...prev,
            package_ids: [...ids],
            cur_pkg_id,
            cur_pkg_version,
            cur_pkg_time,
            last_pkg_id,
            last_pkg_version,
            last_pkg_time,
            timestamp,
          }));
          setInput((prev) => ({
            ...prev,
            isLatest: cur_pkg_version === last_pkg_version,
            checked: true,
          }));
        }
      } else {
        setResult(null);
      }
      setResultError(false);
    } catch (e) {
      console.error('error:', e);
      setResult(null);
      setResultError(true);
      setInput((prev) => ({ ...prev, isLatest: false }));
    } finally {
      setInput((prev) => ({
        ...prev,
        value: '',
        submitStatus: false,
        submitBtnText: 'Search',
        checked: false,
        inpiutError: undefined,
      }));
    }
  };

  return (
    <PageLayout title={FEATURES.packageCheck}>
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="mb-4 flex gap-2">
          <div className="mx-2 flex flex-1 flex-col">
            <input
              id="packageIdInput"
              type="text"
              placeholder="package_id"
              className="flex-1 rounded-lg border border-gray-200 p-3 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
              maxLength={200}
              value={input.value}
              onChange={handleInputChange}
            />
            {input.inputError && (
              <div className="mt-1 text-xs text-red-500">{input.inputError}</div>
            )}
          </div>
          <button
            className={`rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-medium text-white transition-all hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 ${!input.value.trim() || input.submitStatus ? '' : 'hover:cursor-pointer'}`}
            disabled={!input.value.trim() || input.submitStatus}
            onClick={handleButtonClick}
          >
            {input.submitBtnText}
          </button>
        </div>
        {!input.isLatest && input.checked && (
          <>
            <ComparisonCard
              version={result?.cur_pkg_version}
              pkgId={result?.cur_pkg_id}
              pkgTime={result?.cur_pkg_time}
            />
            <ComparisonCard
              version={result?.last_pkg_version}
              pkgId={result?.last_pkg_id}
              pkgTime={result?.last_pkg_time}
            />
          </>
        )}
        {input.isLatest && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
            <p className="font-semibold text-green-800">🎉 Package version is up-to-date!</p>
          </div>
        )}
        {resultError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
            An error occurred, please try again later
          </div>
        )}
      </div>
    </PageLayout>
  );
}
