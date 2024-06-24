import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import { NoProfile } from '../assets';
import moment from 'moment';
import { BiComment, BiLike, BiSolidLike } from "react-icons/bi";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { useForm } from 'react-hook-form';
import { CustomButton, Loading, TextInput } from '../components';
import { apiRequest } from '../utils';

const getPostComments = async (id) => {
    try {
        const res = await apiRequest({
            url: "/posts/comments/" + id,
            method: "GET",
        });
        return res?.data;
    } catch (error) {
        console.log(error);
    }
}

const ReplyCard = ({ reply, user, handleLike }) => {
    return (
        <div className='w-full py-3'>
            <div className='flex gap-3 items-center mb-1'>
                <Link to={"/profile/" + reply?.userId?._id}>
                    <img src={reply?.userId?.profileUrl ?? NoProfile} alt={reply?.userId?.firstName} className='w-10 h-10 rounded-full object-cover' />
                </Link>

                <div>
                    <Link to={"/profile/" + reply?.userId?._id}>
                        <p className='font-medium text-base text-ascent-1'>
                            {reply?.userId.firstName} {reply?.userId.lastName}
                        </p>
                    </Link>
                    <span className='text-ascent-2 text-sm'>
                        {moment(reply?.createdAt).fromNow()}
                    </span>
                </div>
            </div>

            <div className='ml-12'>
                <p className='text-ascent-2'>{reply?.comment}</p>

                <div className='mt-2 flex gap-6 text-ascent-2'>
                    <p className='flex gap-2 items-center text-base cursor-pointer' onClick={handleLike}>
                        {reply?.likes?.includes(user?._id) ? (
                            <BiSolidLike size={20} color='blue' />
                        ) : (
                            <BiLike size={20} />
                        )}
                        {reply?.likes?.length} Likes
                    </p>
                </div>
            </div>
        </div>
    )
}

const CommentForm = ({ user, id, replyAt, getComments }) => {
    const [loading, setLoading] = useState(false);
    const [errMsg, setErrMsg] = useState("");
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        mode: "onChange",
    });

    const onSubmit = async (data) => {
        setLoading(true);
        setErrMsg("");
        try {
            const URL = !replyAt
                ? "/posts/comment/" + id
                : "/posts/reply-comment/" + id;

            const newData = {
                comment: data?.comment,
                from: user?.firstName + " " + user?.lastName,
                replyAt: replyAt,
            };

            const res = await apiRequest({
                url: URL,
                data: newData,
                token: user?.token,
                method: "POST",
            });

            if (res?.status === "failed") {
                setErrMsg(res);
            } else {
                reset({
                    comment: "",
                });

                setErrMsg("");
                await getComments();
            }
            setLoading(false);

        } catch (error) {
            console.log(error);
            setLoading(false);
        }
    }
    return (
        <form className='w-full border-b border-[#66666645'
            onSubmit={handleSubmit(onSubmit)}>
            <div className='w-full flex items-center gap-2 py-4'>
                <img src={user?.profileUrl ?? NoProfile} alt="User Image"
                    className='w-10 h-10 rounded-full object-cover' />
                <TextInput
                    name='comment'
                    styles='w-full rounded-full py-3'
                    register={register("comment", {
                        required: "Comment can not be empty",
                    })}
                    placeholder={replyAt ? `Reply @${replyAt}` : "Comment this post"}
                    error={errors.comment ? errors.comment.message : ""} />
            </div>
            {
                errMsg?.message && (
                    <span role='alert' className={`text-sm ${errMsg?.status == "failed" ? "text-[#f64949fe]" : "text-[#2ba150fe]"
                        } mt-0.5`}>
                        {errMsg?.message}
                    </span>
                )
            }
            <div className='flex items-end justify-end pb-2'>
                {
                    loading ? (
                        <Loading />
                    ) : (
                        <CustomButton
                            type='submit'
                            title='Submit'
                            containerStyles='bg-[#0444a4] text-white py-1 px-3 rounded-full font-semibold text-sm' />
                    )
                }
            </div>
        </form>
    )
}

const PostCard = ({ post, user, deletePost, likePost }) => {

    const [showAll, setShowAll] = useState(0);
    const [showReply, setShowReply] = useState(0);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [replyComments, setReplyComments] = useState(0);
    const [showComments, setShowComments] = useState(0);

    const getComments = async (id) => {
        setReplyComments(0);
        const result = await getPostComments(id);

        setComments(result);
        setLoading(false);
    };

    const handleLike = async (uri) => {
        await likePost(uri);
        await getComments(post?._id);
    };

    return (
        <div className='mb-2 bg-primary p-4 rounded-xl'>
            <div className='flex gap-3 items-center mb-2'>
                <Link to={'/profile/' + post?.userId?._id}>
                    <img src={post?.userId?.profileUrl ?? NoProfile}
                        alt={post?.userId?.firstName}
                        className='w-12 h-10 md:w-16 md:h-14 object-cover rounded-full' />
                </Link>

                <div className='w-full flex justify-between'>
                    <div>
                        <Link to={'/profile/' + post?.userId?._id}>
                            <p className='font-medium text-lg text-ascent-1'>{post?.userId?.firstName} {post?.userId?.lastName}</p>
                        </Link>
                        <span className='text-ascent-2'>{post?.userId?.location}</span>
                        <span className='md:hidden flex text-ascent-2 text-xs'>
                            {moment(post?.createdAt ?? "2024-06-10").fromNow()}
                        </span>
                    </div>

                    <span className='hidden md:flex text-ascent-2'>
                        {moment(post?.createdAt ?? "2024-06-10").fromNow()}
                    </span>
                </div>
            </div>

            <div>
                <p className='text-ascent-2'>
                    {showAll === post?._id ? post?.description : post?.description.slice(0, 300)}
                    {post?.description?.length > 301 &&
                        (showAll === post?._id ?
                            (<span className='text-blue ml-2 font-medium cursor-pointer' onClick={() => setShowAll(0)}>Show Less</span>) : (<span className='text-blue ml-2 font-medium cursor-pointer' onClick={() => setShowAll(post?._id)}>Show More</span>))}
                </p>

                {
                    post?.image && (
                        <img src={post?.image}
                            alt="post image"
                            className='w-full mt-2 rounded-lg' />
                    )
                }
            </div>

            <div className='mt-4 flex justify-between items-center px-3 py-2 text-ascent-2 text-base border-t border-[#66666645]'>
                <p className='flex gap-2 items-center text-base cursor-pointer'
                    onClick={() => handleLike("/posts/like/" + post?._id)}
                >
                    {post?.likes?.includes(user?._id) ? (
                        <BiSolidLike size={20} color='blue' />
                    ) : (
                        <BiLike size={20} />
                    )}
                    {post?.likes?.length} Likes
                </p>

                <p className='flex gap-2 items-center text-base cursor-pointer' onClick={() => {
                    setShowComments(showComments === post._id ? null : post._id);
                    getComments(post?._id);
                }}>
                    <BiComment size={20} />
                    {post?.comments?.length} Comments
                </p>

                {
                    user?._id === post?.userId?._id &&
                    <div className='flex gap-1 items-center text-base text-ascent-1 cursor-pointer' onClick={() => deletePost(post?._id)}>
                        <MdOutlineDeleteOutline size={20} />
                        <span>Delete</span>
                    </div>
                }
            </div>

            {/* comments */}
            {
                showComments === post?._id && (
                    <div className='w-full mt-4 border-t border-[#66666645] pt-4'>
                        <CommentForm
                            user={user}
                            id={post?._id}
                            getComments={() => getComments(post?._id)} />

                        {
                            loading ? (<Loading />) : (
                                comments?.length > 0 ? (
                                    comments?.map((comment) => (
                                        <div className='w-full py-2' key={comment?._id}>
                                            <div className='flex gap-3 items-center mb-1'>
                                                <Link to={'/profile/' + comment?.userId?._id}>
                                                    <img src={comment?.userId?.profileUrl ?? NoProfile}
                                                        alt={comment?.userId?.firstName}
                                                        className='w-10 h-10 rounded-full object-cover' />
                                                </Link>
                                                <Link to={'/profile/' + comment?.userId?._id}>
                                                    <p className='font-medium text-base text-ascent-1'>
                                                        {comment?.userId?.firstName} {comment?.userId?.lastName}
                                                    </p>
                                                </Link>
                                                <span className='text-ascent-2 text-sm'>
                                                    {moment(comment?.createdAt ?? "2024-06-10").fromNow()}
                                                </span>
                                            </div>

                                            <div className='ml-12'>
                                                <p className='text-ascent-2'>{comment?.comment}</p>

                                                <div className='mt-2 flex gap-6'>
                                                    <p className='flex gap-2 items-center text-base text-ascent-2 cursor-pointer'
                                                        onClick={() => {
                                                            handleLike("/posts/like-comment/" + comment?._id);
                                                        }}
                                                    >
                                                        {
                                                            comment?.likes?.includes(user?._id) ?
                                                                (<BiSolidLike size={20} color='blue' />) :
                                                                (<BiLike size={20} />)
                                                        }
                                                        {comment?.likes?.length} Likes
                                                    </p>
                                                    <span className='text-blue cursor-pointer'
                                                        onClick={() => setReplyComments(comment?._id)}>
                                                        Reply
                                                    </span>
                                                </div>

                                                {replyComments === comment?._id && (
                                                    <CommentForm
                                                        user={user}
                                                        id={comment?._id}
                                                        replyAt={comment?.from}
                                                        getComments={() => getComments(post?._id)} />
                                                )}
                                            </div>

                                            {/* replies */}
                                            <div className='py-2 px-8 mt-6'>
                                                {comment?.replies?.length > 0 && (
                                                    <p className='text-base text-ascent-1 cursor-pointer'
                                                        onClick={() => setShowReply(
                                                            showReply === comment?.replies?._id ? 0 : comment?.replies?._id
                                                        )}>
                                                        Show Replies ({comment?.replies?.length})
                                                    </p>
                                                )}

                                                {
                                                    showReply === comment?.replies?._id && comment?.replies?.map((reply) => (
                                                        <ReplyCard
                                                            reply={reply}
                                                            user={user}
                                                            key={reply?._id}
                                                            handleLike={
                                                                () => handleLike(
                                                                    "/posts/like-comment/" + comment?._id + "/" + reply?._id
                                                                )
                                                            } />
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    ))
                                ) : (<span className='flex text-sm py-4 text-ascent-2 text-center'>
                                    No Comments, be first to comment
                                </span>)
                            )
                        }

                    </div>
                )
            }
        </div>
    )
}

export default PostCard;