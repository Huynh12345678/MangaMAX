import "src/styles/index.css";
import React, { useEffect, useState } from 'react';
import Navbar from 'src/components/Navbar';
import { WINDOW_RESIZE_DEBOUNCE, WINDOW_SIZE } from '@/constants/index';
import { windowResize } from 'src/store/action';
import { QueryClient, QueryClientProvider } from "react-query";
import { removeLoadingBar, callLoadingBar } from 'src/shared/callLoadingBar';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from 'src/shared/firebase';
import { user as setUser, bookmarks as setBookmarks } from 'src/store/action';
import { db } from 'src/shared/firebase';
import { useAppSelector, useAppDispatch } from 'src/hooks/useRedux';
import { wrapper } from 'src/store';
import {
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import Draggable from '@/components/Draggable';
import { useRouter } from "next/router";
import Head from 'src/components/Head';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1
    },
  },
});

const MyApp = ({ Component, pageProps }) => {
  const { reducer2: { windowSize } } = useAppSelector((state) => state);
  const [scroll, setScroll] = useState(false);
  const [user] = useAuthState(auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { pathname } = router;

  // useEffect(() => {
  // console.log(queryClient.getQueryCache());
  //   queryClient.clear(); //change source to clear all cache => bị fetch api 2 lần
  // }, [select.source, select.type]);

  //watch resize
  useEffect(() => {
    let timeout = null;
    const resize = () => {
      const { innerWidth } = window;
      if (
        innerWidth < WINDOW_SIZE.mobile &&
        windowSize !== WINDOW_SIZE.mobile
      ) {
        dispatch(windowResize(WINDOW_SIZE.mobile))
      } else if (
        innerWidth >= WINDOW_SIZE.mobile &&
        innerWidth < WINDOW_SIZE.phablet &&
        windowSize !== WINDOW_SIZE.phablet
      ) {
        dispatch(windowResize(WINDOW_SIZE.phablet))
      } else if (
        innerWidth >= WINDOW_SIZE.phablet &&
        innerWidth < WINDOW_SIZE.tablet &&
        windowSize !== WINDOW_SIZE.tablet
      ) {
        dispatch(windowResize(WINDOW_SIZE.tablet))
      } else if (
        innerWidth >= WINDOW_SIZE.tablet &&
        innerWidth < WINDOW_SIZE.laptop &&
        windowSize !== WINDOW_SIZE.laptop
      ) {
        dispatch(windowResize(WINDOW_SIZE.laptop))
      } else if (
        innerWidth >= WINDOW_SIZE.laptop &&
        innerWidth < WINDOW_SIZE.desktop &&
        windowSize !== WINDOW_SIZE.desktop
      ) {
        dispatch(windowResize(WINDOW_SIZE.desktop))
      } else if (
        innerWidth >= WINDOW_SIZE.desktop &&
        windowSize !== WINDOW_SIZE.all
      ) {
        dispatch(windowResize(WINDOW_SIZE.all))
      }
    };
    const onWidthResize = () => {
      clearTimeout(timeout); //tránh lặp value, gọi hàm quá nhiều lần
      timeout = setTimeout(() => {
        resize();
      }, WINDOW_RESIZE_DEBOUNCE);
    };
    onWidthResize();
    window.addEventListener('resize', onWidthResize);
    return () => {
      window.removeEventListener('resize', onWidthResize);
    };
  }, [windowSize, dispatch]) //=> add windowSize để cập nhật giá trị của windowSize trong useEffect()

  //watch scroll
  useEffect(() => {
    const listenToScroll = () => {
      const scrolled = window.pageYOffset; //scroll position
      if (scrolled > 50) { //scroll => true
        if (!scroll) {
          setScroll(true);
        }
      } else { //scroll => false
        if (scroll) {
          setScroll(false);
        }
      }
    }

    window.addEventListener('scroll', listenToScroll);
    return () => {
      window.removeEventListener('scroll', listenToScroll);
    }
  }, [scroll]) //=> add scroll để chạy lại => cập nhật giá trị của scroll trong useEffect()

  //handle router loading
  useEffect(() => {
    callLoadingBar();
    return () => removeLoadingBar();
  }, [])

  useEffect(() => {
    if (pathname === '/' || pathname === '/search') {
      document.body.style.removeProperty('transition');
    } else {
      document.body.style.transition = 'all 325ms cubic-bezier(0, 0, 0.2, 1) 0ms';
    }
  }, [pathname])

  useEffect(() => {
    const fetchDocument = async () => {
      const q = query(collection(db, "users"), where("uid", "==", user?.uid));
      const docs = await getDocs(q);
      const { bookmarks, name } = docs && docs.docs[0].data();
      const { id } = docs.docs[0];

      dispatch(setUser({
        uid: user.uid,
        email: user.email,
        photoURL: user.photoURL,
        displayName: name,
        docid: id
      }));
      dispatch(setBookmarks(bookmarks));
      dispatch({ type: 'LOADING', isLoading: false });
    }

    if (user) {
      fetchDocument();
    } else {
      dispatch(setUser(null));
      dispatch(setBookmarks([]));
    }
  }, [user]);

  return (
    <>
      <Head />
      <QueryClientProvider client={queryClient}>
        <Navbar scroll={scroll} />
        <Component {...pageProps} />
        <Draggable />
      </QueryClientProvider>
    </>
  )
}

export default wrapper.withRedux(MyApp);