import {useState} from "react";
import {Form, useTransition} from "@remix-run/react";
import Loading from "~/components/Loading";

interface Props {
    itemName: string;
    query?: string;
    action?: string;
    onSearch?: (query: string) => void;
    children: any;
}

export default function SearchPanel(props: Props) {
    const [q, setQ] = useState<string>(props.query || '');
    const {state} = useTransition();

    function submit(e) {
        if (e.onSearch) {
            e.preventDefault();
            props.onSearch(q);
            return;
        }
    }
    return <div className="container-fluid bg-dark text-white">
        <div className="row">
            <div className="col-lg-12 text-center">
                <Form onSubmit={submit} action={props.action} className="row">
                    <input type="text" name="q" className="col-lg-9" placeholder={`Search ${props.itemName}`} value={q} onChange={e => setQ(e.target.value)} />
                    <input type="submit" value={`Search ${props.itemName}`} className="btn btn-primary col-lg-3" />
                </Form>
            </div>
        </div>
        <div className="row">
            {state === "submitting" && <Loading />}
            {state !== "submitting" && props.children}
        </div>
    </div>
}
