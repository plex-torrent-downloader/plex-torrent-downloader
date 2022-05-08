import {useState} from "react";

interface Props {
    itemName: string;
    query?: string;
    action?: string;
    onSearch: (query: string) => void;
    children: any;
}

export default function SearchPanel(props: Props) {
    const [q, setQ] = useState<string>(props.query || '');

    function submit(e) {
        if (e.onSearch) {
            e.preventDefault();
            props.onSearch(q);
            return;
        }
    }
    return <div className="container bg-dark text-white">
        <div className="row">
            <div className="col-lg-12 text-center">
                <form onSubmit={submit} action={props.action} className="row">
                    <input type="text" name="q" className="col-lg-9" placeholder={`Search ${props.itemName}`} value={q} onChange={e => setQ(e.target.value)} />
                    <input type="submit" value={`Search ${props.itemName}`} className="btn btn-primary col-lg-3" />
                </form>
            </div>
        </div>
        <div className="row">
            {props.children}
        </div>
    </div>
}
