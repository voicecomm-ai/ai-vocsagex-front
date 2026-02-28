import { useEffect, useCallback, useRef, useState } from "react";

export const usePageRequest = (fn, options) => {
  const {
    onSuccess,
    onError,
    searchParams = {},
    pageParams,
    isInitial,
  } = options;

  const [extLoading, setExtLoading] = useState(false);
  const [extData, setExtData] = useState(null);
  const [extPagination, setExtPagination] = useState({
    current: 1,
    size: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条数据`,
  });

  useEffect(() => {
    if (isInitial) {
      fetchData();
    }
  }, [isInitial]);

  const fetchData = useCallback(
    async (customPagination) => {
      console.log(customPagination, "customPagination");

      const { current, size } = customPagination || extPagination;
      setExtLoading(true);
      await fn({ current, size, ...searchParams })
        .then(({ data }) => {
          setExtData(data.records);
          setExtPagination((prev) => ({ ...prev, total: data.total }));
          onSuccess && onSuccess(data);
        })
        .catch((error) => {
          setExtLoading(false);
          onError && onError(error);
        })
        .finally(() => {
          setExtLoading(false);
        });
    },
    [searchParams, extPagination]
  );

  const extSearch = async () => {
    setExtPagination((prev) => ({ ...prev, current: 1 }));
    await fetchData();
  };

  const onPageChange = async ({ current, pageSize }) => {
    const newPageConfig = { ...extPagination, current, size: pageSize };
    setExtPagination(newPageConfig);
    await fetchData(newPageConfig);
  };

  return {
    extLoading,
    extData,
    extPagination,
    extSearch,
    onPageChange,
    fetchData,
  };
};
